import logging

import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

logger = logging.getLogger(__name__)


@sio.on("connect", namespace="/runners")
async def connect(sid, env, auth):
    runner_token = auth.get("runnerToken", None)
    if runner_token:
        logger.info(f"Runner {runner_token} connected with sid {sid}")


@sio.on("disconnect", namespace="/runners")
async def disconnect(sid):
    logger.info(f"{sid} disconnected")


async def send_available_jobs_ping_to_runners():
    await sio.emit("available-jobs", namespace="/runners")
