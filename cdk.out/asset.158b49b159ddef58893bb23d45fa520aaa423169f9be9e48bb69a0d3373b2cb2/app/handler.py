import os
from typing import Any, Dict

import boto3

from app.segmenter import process_image

s3 = boto3.client("s3")

UPLOADS_BUCKET_NAME = os.environ.get("UPLOADS_BUCKET_NAME")
PROCESSED_PREFIX = os.environ.get("PROCESSED_PREFIX", "closet/processed")


def _read_s3_object(bucket: str, key: str) -> bytes:
  resp = s3.get_object(Bucket=bucket, Key=key)
  return resp["Body"].read()


def _write_s3_object(bucket: str, key: str, body: bytes) -> None:
  s3.put_object(
    Bucket=bucket,
    Key=key,
    Body=body,
    ContentType="image/png",
  )


def _derive_output_key(input_key: str) -> str:
  """
  Input:  "closet/user123/item-abc.jpg"
  Output: "closet/processed/user123/item-abc.png"
  """
  clean = input_key.lstrip("/")

  # Remove optional "closet/" prefix so we don't end up with closet/processed/closet/...
  if clean.startswith("closet/"):
    clean = clean[len("closet/") :]

  # Strip extension
  if "." in clean:
    base = clean.rsplit(".", 1)[0]
  else:
    base = clean

  return f"{PROCESSED_PREFIX.rstrip('/')}/{base}.png"


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
  print("Event:", event)

  # Case 1: S3 event
  if "Records" in event and "s3" in event["Records"][0]:
    record = event["Records"][0]
    input_bucket = record["s3"]["bucket"]["name"]
    input_key = record["s3"]["object"]["key"]

  else:
    # Case 2: Direct invocation (Step Functions / AppSync / API)
    input_bucket = event.get("inputBucket") or UPLOADS_BUCKET_NAME

    item = event.get("item") or {}
    input_key = event.get("inputKey") or item.get("s3Key")

    if not input_bucket or not input_key:
      raise ValueError(
        "Missing inputBucket/inputKey or item.s3Key in event; "
        f"event={event}"
      )

  output_bucket = UPLOADS_BUCKET_NAME or input_bucket
  output_key = event.get("outputKey") or _derive_output_key(input_key)

  # Run segmentation
  img_bytes = _read_s3_object(input_bucket, input_key)
  png_bytes = process_image(img_bytes)
  _write_s3_object(output_bucket, output_key, png_bytes)

  return {
    "inputBucket": input_bucket,
    "inputKey": input_key,
    "outputBucket": output_bucket,
    "outputKey": output_key,
  }
