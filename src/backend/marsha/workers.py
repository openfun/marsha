"""Configurable with environment variable UvicornWorker."""

import os

from uvicorn.workers import UvicornWorker


class MarshaUvicornWorker(UvicornWorker):
    """Configurable with environment variable UvicornWorker."""

    CONFIG_KWARGS = {
        "http": os.environ.get("UVICORN_HTTP_PROTOCOL", "auto"),
        "log_level": os.environ.get("UVICORN_LOG_LEVEL", "info"),
        "loop": os.environ.get("UVICORN_LOOP_PROTOCOL", "auto"),
        "proxy_headers": os.environ.get("UVICORN_PROXY_HEADERS", True),
        "ws": os.environ.get("UVICORN_WEBSOCKET_PROTOCOL", "auto"),
        "ws_ping_interval": os.environ.get("UVICORN_WEBSOCKET_PING_INTERVAL", 20),
        "ws_ping_timeout": os.environ.get("UVICORN_WEBSOCKET_PING_TIMEOUT", 30),
    }
