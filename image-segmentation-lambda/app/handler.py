# image-segmentation-lambda/app/handler.py

import json
import os
import boto3

from app.segmenter import process_image

s3 = boto3.client("s3")

UPLOADS_ENV = "UPLOADS_BUCKET_NAME"
PROCESSED_PREFIX_ENV = "PROCESSED_PREFIX"


def _get_env(name: str, default=None):
  val = os.environ.get(name, default)
  if val is None:
    raise RuntimeError(f"Missing required env var {name}")
  return val


def _download_s3_object(bucket: str, key: str) -> bytes:
  resp = s3.get_object(Bucket=bucket, Key=key)
  return resp["Body"].read()


def _upload_s3_object(bucket: str, key: str, data: bytes, content_type: str = "image/png"):
  s3.put_object(
    Bucket=bucket,
    Key=key,
    Body=data,
    ContentType=content_type,
  )


def handler(event, context):
  """
  Entry-point for the Docker Lambda.

  Expected shapes (we support all of these):

    { "item": { "s3Key": "closet/…jpg" } }
    { "item": { "rawMediaKey": "closet/…jpg" } }
    { "s3Key": "closet/…jpg" }
    { "rawMediaKey": "closet/…jpg" }

  Returns a superset of fields so existing Step Functions /
  Lambdas can bind however they like:

    {
      "inputBucket":  "...",
      "inputKey":     "closet/…jpg",
      "outputBucket": "...",
      "outputKey":    "closet/processed/…png",

      "processedKey": "closet/processed/…png",

      "segmentation": {
        "bucket":       "...",
        "inputKey":     "closet/…jpg",
        "processedKey": "closet/processed/…png"
      }
    }
  """
  bucket = _get_env(UPLOADS_ENV)
  processed_prefix = os.environ.get(PROCESSED_PREFIX_ENV, "closet/processed")

  # Be tolerant of different event shapes
  item = event.get("item") if isinstance(event, dict) else None
  input_key = None

  if item and isinstance(item, dict):
    input_key = item.get("s3Key") or item.get("rawMediaKey")

  if not input_key:
    input_key = event.get("s3Key") or event.get("rawMediaKey")

  if not input_key:
    raise ValueError(f"Missing s3Key/rawMediaKey in event: {json.dumps(event)}")

  input_key = str(input_key).lstrip("/")

  # Download original
  img_bytes = _download_s3_object(bucket, input_key)

  # Run background removal → PNG bytes
  png_bytes = process_image(img_bytes)

  # Build output key: closet/processed/<same-subpath>.png
  # e.g. closet/test-user/item-002.jpg → closet/processed/test-user/item-002.png
  base_key = input_key
  if base_key.startswith("closet/"):
    tail = base_key[len("closet/") :]
  else:
    tail = base_key

  root, _ext = os.path.splitext(tail)
  output_key = f"{processed_prefix.rstrip('/')}/{root}.png"

  # Upload the PNG
  _upload_s3_object(bucket, output_key, png_bytes, content_type="image/png")

  # Return ALL likely shapes so the rest of the pipeline can pick whatever it expects
  return {
    # generic fields
    "inputBucket": bucket,
    "inputKey": input_key,
    "outputBucket": bucket,
    "outputKey": output_key,

    # legacy-ish key some Step Functions use
    "processedKey": output_key,

    # nested for ResultPath-based pipelines
    "segmentation": {
      "bucket": bucket,
      "inputKey": input_key,
      "processedKey": output_key,
    },
  }
