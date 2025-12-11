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

# Copy model weights into /opt/models (read-only)
COPY models/ /opt/models/

# Copy function code
COPY app/ ${LAMBDA_TASK_ROOT}/app

# Make sure Python can find our app module
ENV PYTHONPATH="${LAMBDA_TASK_ROOT}"

# Optional: expose model path via env
ENV MODEL_PATH=/opt/models/modnet.onnx

# Lambda handler: app.handler.handler
CMD ["app.handler.handler"]
