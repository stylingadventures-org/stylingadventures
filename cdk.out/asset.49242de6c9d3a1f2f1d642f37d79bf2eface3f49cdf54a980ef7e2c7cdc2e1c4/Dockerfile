FROM public.ecr.aws/lambda/python:3.11

# Optional: system deps for Pillow / onnxruntime (keep minimal)
RUN yum install -y \
    gcc \
    zlib-devel \
    libjpeg-turbo-devel \
 && yum clean all

# Install Python deps into Lambda task root
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -t "${LAMBDA_TASK_ROOT}"

# Copy model weights into /opt/models (read-only layer)
# (Optional – if you don't have local models yet, this just won't be used.)
COPY models/ /opt/models/

# Copy function code
COPY app/ ${LAMBDA_TASK_ROOT}/app

# Runtime environment:
# - PYTHONPATH so Lambda can import app.*
# - MODEL_PATH for custom models (not strictly required by rembg right now)
# - XDG_CACHE_HOME / POOCH_HOME: where rembg/pooch cache model files
# - NUMBA_CACHE_DIR: where numba stores compiled functions
ENV PYTHONPATH="${LAMBDA_TASK_ROOT}" \
    MODEL_PATH=/opt/models/modnet.onnx \
    XDG_CACHE_HOME=/tmp/rembg \
    POOCH_HOME=/tmp/rembg \
    NUMBA_CACHE_DIR=/tmp/numba

# Lambda handler: app.handler.handler
CMD ["app.handler.handler"]
