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
os.environ.setdefault("HOME", "/tmp")

s3 = boto3.client("s3")


def _first_env(*names: str) -> Optional[str]:
    for n in names:
        v = os.getenv(n)
        if v:
            return v
    return None


def _extract_bucket_key(event: Dict[str, Any]) -> Tuple[str, str]:
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
            bucket, key, err.get("Code"), err.get("Message")
        )
        raise


def _upload_s3_object(bucket: str, key: str, body: bytes, content_type: str = "image/png") -> None:
    s3.put_object(Bucket=bucket, Key=key, Body=body, ContentType=content_type)


def _has_alpha(png_bytes: bytes) -> bool:
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(png_bytes))
        return img.mode in ("RGBA", "LA") or ("transparency" in img.info)
    except Exception:
        return False


def _segment_background(image_bytes: bytes) -> bytes:
    """
    Uses rembg and forces the clothing segmentation model.
    Returns PNG bytes with alpha.
    """
    try:
        from rembg import remove, new_session  # type: ignore
    except Exception as e:
        raise RuntimeError(
            "rembg is not available in this container image. "
            "Ensure it is installed in requirements.txt and baked into the image."
        ) from e

    # ✅ KEY FIX: use clothing model (better for closet items)
    # This will download the model into /tmp cache on first cold start.
    session = new_session("u2net_cloth_seg")

    out = remove(image_bytes, session=session)

    if isinstance(out, (bytes, bytearray)):
        return bytes(out)

    # Fallback if rembg returns PIL
    buf = io.BytesIO()
    out.save(buf, format="PNG")  # type: ignore[attr-defined]
    return buf.getvalue()


def _enhance_png(png_bytes: bytes, size: int = 800) -> bytes:
    """
    Enhancement:
      - sharpen
      - brightness + saturation
      - 800x800 contain with transparent padding
    """
    from PIL import Image, ImageEnhance, ImageFilter

    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")

    # Sharpen
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=150, threshold=3))

    # Brightness and saturation
    img = ImageEnhance.Brightness(img).enhance(1.1)
    img = ImageEnhance.Color(img).enhance(1.2)

    # Contain resize
    img.thumbnail((size, size), Image.LANCZOS)

    # Transparent canvas + center
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    canvas.paste(img, (x, y), img)

    out = io.BytesIO()
    canvas.save(out, format="PNG")
    return out.getvalue()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    logger.info("event=%s", json.dumps(event)[:2000])

    bucket, input_key = _extract_bucket_key(event)

    processed_prefix = os.getenv("PROCESSED_PREFIX", "closet/processed").strip("/")
    base = os.path.basename(input_key)
    stem = os.path.splitext(base)[0]
    out_key = f"{processed_prefix}/{stem}-{uuid.uuid4().hex}.png"

    logger.info("processing bucket=%s input_key=%s out_key=%s", bucket, input_key, out_key)

    original_bytes = _download_s3_object(bucket, input_key)
    logger.info("downloaded bytes=%d", len(original_bytes))

    segmented_png = _segment_background(original_bytes)
    logger.info("segmented bytes=%d alpha=%s", len(segmented_png), _has_alpha(segmented_png))

    enhanced_png = _enhance_png(segmented_png, size=800)
    logger.info("enhanced bytes=%d alpha=%s", len(enhanced_png), _has_alpha(enhanced_png))

    _upload_s3_object(bucket, out_key, enhanced_png, content_type="image/png")
    logger.info("uploaded s3://%s/%s", bucket, out_key)

    result = {"ok": True, "bucket": bucket, "inputKey": input_key, "outputKey": out_key}
    logger.info("result=%s", json.dumps(result))
    return result
