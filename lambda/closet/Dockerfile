FROM public.ecr.aws/lambda/nodejs:18

# Copy package manifests first (better layer caching)
COPY package*.json ./

# Install deps (Sharp will compile or pull correct binary for Amazon Linux)
RUN npm ci --omit=dev

# Copy the compiled JS output (recommended: build TS -> dist/)
COPY dist/ ./

# If your handler is dist/remove-model.handler:
CMD ["remove-model.handler"]
