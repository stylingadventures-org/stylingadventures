import os
import io
import json
import logging
from typing import Any, Dict, Tuple

import boto3
from botocore.client import Config
from PIL import Image
from rembg import remove

log = logging.getLogger()
log.setLevel(logging.INFO)

s3 = boto3.client("s3", config=Config(signature_version="s3v4"))

UPLOADS_BUCKET = os.environ.get("UPLOADS_BUCKET_NAME") or os.environ.get("UPLOADS_BUCKET")
if not UPLOADS_BUCKET:
    raise RuntimeError("Missing env UPLOADS_BUCKET_NAME / UPLOADS_BUCKET")


def _extract_bucket_key(event: Dict[str, Any]) -> Tuple[str, str]:
    """
    Supports:
      - { key, bucket }
      - { s3Key }
      - { item: { s3Key } }
      - { item: { key } }
    """
    src = event
    if isinstance(event.get("item"), dict):
        # merge "item" fields into the lookup pool
        src = {**event, **event["item"]}

    bucket = (
        src.get("bucket")
        or src.get("sourceBucket")
        or src.get("uploadsBucket")
        or UPLOADS_BUCKET
    )

    key = (
        src.get("key")
        or src.get("s3Key")
        or src.get("rawMediaKey")
        or src.get("inputKey")
        or src.get("imageKey")
    )

    # S3 event shape fallback
    records = event.get("Records") or []
    if (not bucket or not key) and records:
        try:
            rec0 = records[0]
            s3info = rec0["s3"]
            bucket = bucket or s3info["bucket"]["name"]
            key = key or s3info["object"]["key"]
        except Exception:
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


def _remove_bg_with_rembg(image_bytes: bytes) -> bytes:
    """
    Returns PNG bytes with transparency.
    """
    return remove(image_bytes)  # rembg returns PNG bytes


def _ensure_png(image_bytes: bytes) -> Tuple[bytes, str]:
    """
    Ensure bytes are valid PNG.
    """
    im = Image.open(io.BytesIO(image_bytes))
    out = io.BytesIO()
    # keep alpha if present
    if im.mode not in ("RGBA", "LA"):
        im = im.convert("RGBA")
    im.save(out, format="PNG")
    return out.getvalue(), "image/png"


def _output_key_for_closet(input_key: str) -> str:
    """
    input:  closet/<id>.jpg
    output: uploads/closet/<id>/removed-bg.png
    """
    base = os.path.basename(input_key)
    item_id = base.rsplit(".", 1)[0]
    return f"uploads/closet/{item_id}/removed-bg.png"


def handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    log.info("Segmentation handler event: %s", json.dumps(event))

    bucket, input_key = _extract_bucket_key(event)

    original_bytes = _download_s3_object(bucket, input_key)

    # REAL background removal
    cutout_bytes = _remove_bg_with_rembg(original_bytes)

    cutout_png, content_type = _ensure_png(cutout_bytes)

    output_key = _output_key_for_closet(input_key)

    _upload_s3_object(UPLOADS_BUCKET, output_key, cutout_png, content_type)

    result = {
        "bucket": UPLOADS_BUCKET,
        "inputKey": input_key,
        "outputBucket": UPLOADS_BUCKET,
        "outputKey": output_key,
        "processedKey": output_key,
    }

    log.info("Segmentation result: %s", json.dumps(result))
    return result
