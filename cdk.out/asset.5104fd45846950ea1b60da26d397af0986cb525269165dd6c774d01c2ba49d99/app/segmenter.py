import io
from PIL import Image
from rembg import remove


def process_image(image_bytes: bytes) -> bytes:
    """
    Takes raw image bytes, returns PNG bytes with transparent background.
    rembg will return bytes; we re-encode to PNG RGBA to be safe/consistent.
    """
    output_bytes = remove(image_bytes)

    with Image.open(io.BytesIO(output_bytes)).convert("RGBA") as img:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
