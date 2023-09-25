FROM marsha:dev as marsha

FROM mcr.microsoft.com/playwright:v1.40.0-jammy

COPY --from=marsha /app /app
COPY src/backend/setup.cfg /app/src/backend/

WORKDIR /app/src/backend

# Install python 3.11 and Ensure pip is installed
# Install xmlsec1 dependencies required for xmlsec (for SAML)
# Needs to be kept before the `pip install`
RUN apt-get update && \
    apt-get upgrade -y && \
    apt install -y software-properties-common && \
    add-apt-repository -y ppa:deadsnakes/ppa && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        python3.11 \
        python3.11-dev \
        build-essential \
        pkg-config \
        libxml2-dev \
        libxmlsec1-openssl \
        libxmlsec1-dev && \
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 && \
    rm -rf /var/lib/apt/lists/*

# Install development dependencies
# and forcibly remove the marsha package
RUN pip install .[dev,e2e] && \
    pip uninstall -y marsha

RUN playwright install-deps chrome firefox webkit
RUN playwright install chrome firefox webkit
