# Models

Place your MODNet / matting model files here (e.g. `modnet.onnx`).

The Dockerfile copies this folder into `/opt/models/` inside the Lambda
container image, and the code can reference them via the `MODEL_PATH` env var.
