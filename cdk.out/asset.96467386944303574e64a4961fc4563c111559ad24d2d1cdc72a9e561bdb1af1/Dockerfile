FROM public.ecr.aws/lambda/python:3.11

# Minimal system deps for Pillow / rembg
RUN yum install -y \
    gcc \
    zlib-devel \
    libjpeg-turbo-devel \
 && yum clean all

# Make sure all caches go to /tmp (the only writable place in Lambda)
ENV PYTHONUNBUFFERED=1 \
    XDG_CACHE_HOME=/tmp/.cache \
    POOCH_HOME=/tmp/.cache/pooch \
    HOME=/tmp

# Install Python deps into Lambda task root
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt -t "${LAMBDA_TASK_ROOT}"

# (Optional) if you ever ship local models, they'd go here
# COPY models/ /opt/models/

# Copy function code
COPY app/ ${LAMBDA_TASK_ROOT}/app

# Make sure Python can find our app module
ENV PYTHONPATH="${LAMBDA_TASK_ROOT}"

# Lambda handler: app.handler.handler
CMD ["app.handler.handler"]
