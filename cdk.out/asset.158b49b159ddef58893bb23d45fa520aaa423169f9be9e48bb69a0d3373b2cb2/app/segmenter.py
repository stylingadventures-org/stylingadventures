import io
import os
from typing import Optional

from PIL import Image
from rembg import remove

MODEL_PATH_ENV = "MODEL_PATH"


def process_image(image_bytes: bytes, *, model_path: Optional[str] = None) -> bytes:
  """
  Takes raw image bytes, returns PNG bytes with transparent background.

  If model_path is provided / configured, you could customize rembg
  to use a specific model; for now we use the default model.
  """
  # If you later want to force a local model:
  # model_path = model_path or os.environ.get(MODEL_PATH_ENV)
  # and plug into rembg as needed.

  # Let rembg do the heavy lifting
  output_bytes = remove(image_bytes)

  # Ensure we output PNG with alpha channel
  with Image.open(io.BytesIO(output_bytes)).convert("RGBA") as img:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
