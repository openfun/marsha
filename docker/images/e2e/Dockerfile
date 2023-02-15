FROM marsha:dev as marsha

FROM mcr.microsoft.com/playwright:focal

COPY --from=marsha /app /app
COPY src/backend/setup.cfg /app/src/backend/

WORKDIR /app/src/backend

# Can be removed when switching to mcr.microsoft.com/playwright:jammy
# Install python 3.10
RUN apt update && \
    apt upgrade -y && \
    apt install -y software-properties-common && \
    add-apt-repository ppa:deadsnakes/ppa && \
    apt install -y python3.10 python3.10-dev build-essential

# Can be removed when switching to mcr.microsoft.com/playwright:jammy
# Install pip for python 3.10
RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && \
    python3.10 get-pip.py "pip < 23.0"

# Ensure pip is installed
# Install xmlsec1 dependencies required for xmlsec (for SAML)
# Needs to be kept before the `pip install`
RUN apt-get update && \
    apt-get install -y \
    python3-pip pkg-config libxml2-dev libxmlsec1-openssl libxmlsec1-dev && \
    rm -rf /var/lib/apt/lists/*

# Install development dependencies
# and forcibly remove the marsha package
RUN python3.10 -m pip install .[dev,e2e] && \
    python3.10 -m pip uninstall -y marsha

RUN python3.10 -m playwright install-deps
RUN python3.10 -m playwright install
