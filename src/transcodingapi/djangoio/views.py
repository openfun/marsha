# set async_mode to 'threading', 'eventlet', 'gevent' or 'gevent_uwsgi' to
# force a mode else, the best mode is selected automatically from what's
# installed

import logging

import socketio

sio = socketio.AsyncServer(
    logger=True, engineio_logger=True, async_mode="asgi", cors_allowed_origins="*"
)

# async_mode = None

# basedir = os.path.dirname(os.path.realpath(__file__))

# sio = socketio.Server(async_mode=async_mode)
# thread = None


# def index(request):
#     global thread
#     if thread is None:
#         thread = sio.start_background_task(background_thread)
#     return HttpResponse(open(os.path.join(basedir, "static/index.html")))


# def background_thread():
#     """Example of how to send server generated events to clients."""
#     count = 0
#     while True:
#         sio.sleep(10)
#         count += 1
#         sio.emit("my_response", {"data": "Server generated event"}, namespace="/test")


logger = logging.getLogger(__name__)

connected_runners = set()


@sio.on("connect", namespace="/runners")
async def connect(sid, env, auth):
    runner_token = auth.get("runnerToken", None)
    if runner_token:
        connected_runners.add(sid)
        logger.info(f"Runner {runner_token} connected with sid {sid}")


@sio.on("disconnect", namespace="/runners")
async def disconnect(sid):
    connected_runners.remove(sid)
    logger.info(f"{sid} disconnected")


async def send_available_jobs_ping_to_runners():
    await sio.emit("available-jobs", namespace="/runners")
