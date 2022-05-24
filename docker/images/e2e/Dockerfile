FROM marsha:dev as marsha

FROM mcr.microsoft.com/playwright:focal

COPY --from=marsha /app /app
COPY src/backend/setup.cfg /app/src/backend/

WORKDIR /app/src/backend

# Ensure pip is installed
# Install xmlsec1 dependencies required for xmlsec (for SAML)
# Needs to be kept before the `pip install`
RUN apt-get update && \
    apt-get install -y \
    python3-pip pkg-config libxml2-dev libxmlsec1-openssl libxmlsec1-dev && \
    rm -rf /var/lib/apt/lists/*

# Install development dependencies
# and forcibly remove the marsha package
RUN pip install .[dev,e2e] && \
    pip uninstall -y marsha

RUN playwright install-deps
RUN playwright install
