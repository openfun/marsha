FROM marsha:dev as marsha

FROM mcr.microsoft.com/playwright:focal

COPY --from=marsha /app /app
COPY src/backend/setup.cfg /app/src/backend/

WORKDIR /app/src/backend

# Ensure pip is insta
RUN apt-get update && apt-get install -y python3-pip

# Install development dependencies
# and forcibly remove the marsha package
RUN pip install .[dev,e2e] && \
    pip uninstall -y marsha

RUN playwright install-deps
RUN playwright install
