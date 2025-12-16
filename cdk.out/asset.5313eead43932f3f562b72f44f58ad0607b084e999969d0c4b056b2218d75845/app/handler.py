import os
import io
import json
import uuid
import logging
import urllib.parse
from typing import Any, Dict, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))

# Reduce common Numba/rembg cache + shm issues in Lambda containers
os.environ.setdefault("NUMBA_CACHE_DIR", "/tmp/numba_cache")
os.environ.setdefault("MPLCONFIGDIR", "/tmp/mplconfig")
os.environ.setdefault("XDG_CACHE_HOME", "/tmp/.cache")

s3 = boto3.client("s3")

# Lazy / cached rembg session
_REMBG_SESSION = None


def _first_env(*names: str) -> Optional[str]:
    for n in names:
        v = os.getenv(n)
        if v:
            return v
    return None


def _extract_bucket_key(event: Dict[str, Any]) -> Tuple[str, str]:
    """
    Supports:
      - { "bucket": "...", "key": "closet/..." }
      - { "bucket": "...", "s3Key": "closet/..." }
      - { "item": { "bucket": "...", "key": "..." } }
      - { "item": { "s3Key": "closet/..." } }   (StepFn payload)
      - { "Records": [S3 event...] }

    Bucket fallback (env):
      - UPLOADS_BUCKET_NAME (CDK)
      - UPLOADS_BUCKET / CLOSET_BUCKET / S3_BUCKET / BUCKET (legacy)
    """
    bucket = None
    key = None

    # S3 event notification shape
    if isinstance(event.get("Records"), list) and event["Records"]:
        rec = event["Records"][0]
        s3info = rec.get("s3", {})
        bucket = (s3info.get("bucket") or {}).get("name")
        key = (s3info.get("object") or {}).get("key")

    # Top-level direct fields
    bucket = bucket or event.get("bucket") or event.get("Bucket")
    key = key or event.get("key") or event.get("Key") or event.get("s3Key")

    # Nested item
    item = event.get("item") if isinstance(event.get("item"), dict) else None
    if item:
        bucket = bucket or item.get("bucket") or item.get("Bucket")
        key = key or item.get("key") or item.get("Key") or item.get("s3Key")

    # Env fallback for bucket
    bucket = bucket or _first_env(
        "UPLOADS_BUCKET_NAME",
        "UPLOADS_BUCKET",
        "CLOSET_BUCKET",
        "S3_BUCKET",
        "BUCKET",
    )

    if not bucket or not key:
        raise ValueError(
            f"Unable to determine bucket/key from event. "
            f"bucket={bucket!r}, key={key!r}, keys_in_event={list(event.keys())}"
        )

    # S3 event keys are URL-encoded sometimes
    key = urllib.parse.unquote_plus(key)

    return bucket, key


def _download_s3_object(bucket: str, key: str) -> bytes:
    buf = io.BytesIO()
    try:
        s3.download_fileobj(bucket, key, buf)
        return buf.getvalue()
    except ClientError as e:
        err = e.response.get("Error", {})
        logger.error(
            "S3 download failed bucket=%s key=%s code=%s message=%s",
            bucket,
            key,
            err.get("Code"),
            err.get("Message"),
        )
        raise


def _upload_s3_object(bucket: str, key: str, body: bytes, content_type: str = "image/png") -> None:
    s3.put_object(Bucket=bucket, Key=key, Body=body, ContentType=content_type)


def _get_rembg_session():
    global _REMBG_SESSION
    if _REMBG_SESSION is not None:
        return _REMBG_SESSION

    try:
        from rembg import new_session  # type: ignore
    except Exception as e:
        raise RuntimeError(
            "rembg is not available in this container image. "
            "Ensure it is installed and baked into the Lambda image."
        ) from e

    # Default model is fine; you *can* set REMBG_MODEL_NAME if you want.
    model_name = os.getenv("REMBG_MODEL_NAME")  # e.g. "u2net"
    _REMBG_SESSION = new_session(model_name) if model_name else new_session()
    return _REMBG_SESSION


def _segment_background(image_bytes: bytes) -> bytes:
    """
    Returns PNG bytes with alpha channel.
    Uses a cached rembg session to avoid re-downloading / re-initializing model.
    """
    try:
        from rembg import remove  # type: ignore
    except Exception as e:
        raise RuntimeError("rembg import failed") from e

    session = _get_rembg_session()

    # force alpha output
    out = remove(image_bytes, session=session)

    if isinstance(out, (bytes, bytearray)):
        return bytes(out)

    # Fallback if rembg returns PIL image object
    buf = io.BytesIO()
    out.save(buf, format="PNG")  # type: ignore[attr-defined]
    return buf.getvalue()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    logger.info("event=%s", json.dumps(event)[:2000])

    bucket, input_key = _extract_bucket_key(event)

    processed_prefix = os.getenv("PROCESSED_PREFIX", "closet/processed").strip("/")
    base = os.path.basename(input_key)
    stem = os.path.splitext(base)[0]
    out_key = f"{processed_prefix}/{stem}-{uuid.uuid4().hex}.png"

    logger.info("segmentation start bucket=%s input_key=%s out_key=%s", bucket, input_key, out_key)

    original_bytes = _download_s3_object(bucket, input_key)
    segmented_png = _segment_background(original_bytes)
    _upload_s3_object(bucket, out_key, segmented_png, content_type="image/png")

    result = {
        "ok": True,
        "bucket": bucket,
        "inputKey": input_key,
        "outputKey": out_key,
    }
    logger.info("result=%s", json.dumps(result))
    return result
