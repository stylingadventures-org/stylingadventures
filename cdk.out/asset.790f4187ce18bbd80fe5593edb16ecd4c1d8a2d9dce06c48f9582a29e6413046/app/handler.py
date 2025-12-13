import os
import io
import json
import logging
from typing import Any, Dict, Tuple
from uuid import uuid4

import boto3
from botocore.client import Config
from PIL import Image

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
    Try to find bucket + key from whatever the previous step gave us.

    Step Functions for closet upload are currently sending:
      { "item": { "s3Key": "closet/....jpg" } }

    We ALSO support the older direct shapes and raw S3 events.
    """

    # 1) Bucket: usually just the uploads bucket
    bucket = (
        event.get("bucket")
        or event.get("sourceBucket")
        or event.get("uploadsBucket")
        or UPLOADS_BUCKET
    )

    # 2) Try direct top-level keys first
    key = (
        event.get("key")
        or event.get("rawMediaKey")
        or event.get("inputKey")
        or event.get("imageKey")
    )

    # 3) NEW: nested "item" object from the Step Function
    if not key:
        item = event.get("item") or {}
        key = (
            item.get("s3Key")
            or item.get("rawMediaKey")
            or item.get("key")
        )

    # 4) Raw S3 event from S3 notifications (Records[0].s3.object.key)
    records = event.get("Records") or []
    if (not bucket or not key) and records:
        try:
            rec0 = records[0]
            s3info = rec0["s3"]
            bucket = bucket or s3info["bucket"]["name"]
            key = key or s3info["object"]["key"]
        except Exception:
            pass

    log.info("extract_bucket_key resolved bucket=%s key=%s", bucket, key)

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
    IMPORTANT:
    This is where you plug in your upgraded background-removal service.

    For now, this implementation just returns the *original* image so
    the pipeline still works while we debug. When you're ready, we can
    swap this to call a real API (e.g. Clipdrop, Pixelcut, etc).
    """
    return image_bytes


def _ensure_png(image_bytes: bytes) -> Tuple[bytes, str]:
    """
    Take whatever bytes the background service returned and make sure we
    write a PNG (transparent-capable).
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


def _extract_bucket_key(event: Dict[str, Any]) -> Tuple[str, str]:
    """
    Try very hard to find the bucket + key from whatever the previous step gave us.
    This lets the same worker be used for:
      - Closet upload segmentation
      - Background-change segmentation
    """

    # Direct bucket/key (or fall back to our uploads bucket)
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

    # NEW: Step Functions input shape: { "item": { "s3Key": "closet/....jpg", ... } }
    item = event.get("item") or {}
    if not key and isinstance(item, dict):
        key = (
            item.get("s3Key")
            or item.get("rawMediaKey")
            or item.get("key")
        )

    # S3 event shape (not currently used by the Step Functions, but safe)
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
