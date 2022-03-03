# The base image we inherit from is marsha:latest, but you can override this by
# passing a build argument to your build command, e.g.:
#
# docker build --build-arg BASE_TAG=${CIRCLE_SHA1} .
#
ARG BASE_TAG=latest

FROM marsha:${BASE_TAG}

# Switch back to the root user to install development dependencies
USER root:root

# Install vim
RUN apt-get update && \
    apt-get install -y \
    vim && \
    rm -rf /var/lib/apt/lists/*

# Install development dependencies
# and forcibly remove the marsha package
RUN pip install .[dev] && \
    pip uninstall -y marsha
