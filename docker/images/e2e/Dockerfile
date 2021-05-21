FROM marsha:dev as marsha

FROM mcr.microsoft.com/playwright:focal

COPY --from=marsha /app /app
COPY src/backend/setup.cfg /app/src/backend/

WORKDIR /app/src/backend
RUN pip install .[dev,e2e]
