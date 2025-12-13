import os
import io
import json
import logging
from typing import Any, Dict, Tuple
from uuid import uuid4

import boto3
from botocore.client import Config
from PIL import Image

# Use the local rembg-based segmenter
from .segmenter import process_image

log = logging.getLogger()
log.setLevel(logging.INFO)

s3 = boto3.client("s3", config=Config(signature_version="s3v4"))

UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET_NAME") or os.environ.get(
    "UPLOADS_BUCKET"
)
PROCESSED_PREFIX = (os.environ.get("PROCESSED_PREFIX") or "processed/").strip("/")

if not UPLOADS_BUCKET:
    raise RuntimeError("Missing env UPLOADS_BUCKET_NAME / UPLOADS_BUCKET")


# ----------------- Helpers -----------------


def _now_id() -> str:
    return uuid4().hex


def _extract_bucket_key(event: Dict[str, Any]) -> Tuple[str, str]:
    """
    Figure out which S3 object we should segment.

    Supports multiple shapes so the same Lambda can be used by both
    the closet upload flow and the background-change flow.
    """
    bucket = (
        event.get("bucket")
        or event.get("sourceBucket")
        or event.get("uploadsBucket")
        or UPLOADS_BUCKET
    )

    key = (
        event.get("key")
        or event.get("rawMediaKey")
        or event.get("inputKey")
        or event.get("imageKey")
    )

    # Also handle direct S3 events (not used today, but harmless)
    records = event.get("Records") or []
    if (not bucket or not key) and records:
        try:
            rec0 = records[0]
            s3info = rec0["s3"]
            bucket = bucket or s3info["bucket"]["name"]
            key = key or s3info["object"]["key"]
        except Exception:  # safety net
            pass

    if not bucket or not key:
        raise ValueError(f"Unable to determine bucket/key from event: {event}")

    return bucket, key


def _download_s3_object(bucket: str, key: str) -> bytes:
    log.info("Downloading original image from s3://%s/%s", bucket, key)
    buf = io.BytesIO()
    s3.download_fileobj(bucket, key, buf)
    return buf.getvalue()


def _upload_s3_object(bucket: str, key: str, data: bytes, content_type: str) -> None:
    log.info("Uploading processed image to s3://%s/%s", bucket, key)
    s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)


def _call_background_service(image_bytes: bytes) -> bytes:
    """
    Run local rembg model to remove the background.

    This uses app/segmenter.py which is bundled in the same container
    image. If anything goes wrong we let the exception bubble so the
    Step Function can retry / surface an error.
    """
    return process_image(image_bytes)


def _ensure_png(image_bytes: bytes) -> Tuple[bytes, str]:
    """
    Try hard to convert to PNG so the front-end always gets a
    transparent-capable format.
    """
    try:
        im = Image.open(io.BytesIO(image_bytes))
        out = io.BytesIO()
        im.save(out, format="PNG")
        return out.getvalue(), "image/png"
    except Exception:
        log.warning("Failed to convert to PNG; returning original bytes", exc_info=True)
        return image_bytes, "image/png"


# ----------------- Lambda handler -----------------


def handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    """Entry point used by both closet + bg-change Step Functions."""
    log.info("Segmentation handler event: %s", json.dumps(event))

    bucket, input_key = _extract_bucket_key(event)

    # 1) Download original
    original_bytes = _download_s3_object(bucket, input_key)

    # 2) Run background removal
    segmented_bytes = _call_background_service(original_bytes)

    # 3) Normalise to PNG and choose an output key
    segmented_png, content_type = _ensure_png(segmented_bytes)

    base_name = os.path.basename(input_key)
    if "." in base_name:
        base_name = base_name.rsplit(".", 1)[0]
    processed_key = f"{PROCESSED_PREFIX}/{base_name}-{_now_id()}.png"

    # 4) Upload processed image
    _upload_s3_object(UPLOADS_BUCKET, processed_key, segmented_png, content_type)

    # 5) Return a shape that the Step Functions + resolvers expect
    result = {
        "bucket": UPLOADS_BUCKET,
        "inputKey": input_key,
        "outputBucket": UPLOADS_BUCKET,
        "outputKey": processed_key,
        "processedKey": processed_key,
        "segmentation": {
            "bucket": UPLOADS_BUCKET,
            "inputKey": input_key,
            "processedKey": processed_key,
        },
    }

    log.info("Segmentation result: %s", json.dumps(result))
    return result
