# mongo/Dockerfile

FROM mongo

# Create directory for initialization scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Copy the contents of mongo-init-scripts to the container
COPY mongo-init-scripts /docker-entrypoint-initdb.d/