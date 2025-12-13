import io
from typing import Optional

from PIL import Image
from rembg import remove


def process_image(image_bytes: bytes, *, model_path: Optional[str] = None) -> bytes:
    """
    Takes raw image bytes, returns PNG bytes with transparent background.

    We let rembg manage the model; caching is redirected to /tmp via
    environment variables in the Dockerfile.
    """

    # Call rembg to remove background
    output_bytes = remove(image_bytes)

    # Ensure we output PNG with alpha channel
    with Image.open(io.BytesIO(output_bytes)).convert("RGBA") as img:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
