from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from socketio import ASGIApp, Namespace, Server
from socketio.exceptions import ConnectionRefusedError

if TYPE_CHECKING:
    from transcodingapi.transcoding.models import Runner

from .decorator import debounce

logger = logging.getLogger(__name__)

sio = Server(async_mode="threading")
app = ASGIApp(sio)


# This class is managing all the runner sockets
class RunnerSocket(Namespace):
    def __init__(self, namespace=None):
        super(Namespace, self).__init__(namespace=namespace)
        self.runner_socket_sids = set()

    def on_connect(self, sid, environ, auth):
        print(auth)
        runner_token = auth["accessToken"]
        if runner_token:
            try:
                Runner.objects.get(runnerToken=runner_token)
            except Runner.DoesNotExist:
                raise ConnectionRefusedError("Invalid runner token")
        else:
            raise ConnectionRefusedError("No runner token provided")

        self.runner_socket_sids.add(sid)

    def on_disconnect(self, sid):
        logger.debug(f'Runner "{sid}" disconnected from the notification system.')

        self.runner_socket_sids.remove(sid)

    @debounce(0.5)
    def send_available_jobs_ping_to_runners(self):
        logger.debug(
            f"Sending available-jobs notification to {len(self.runner_socket_sids)} runner sockets"
        )

        for runner_socket_sid in self.runner_socket_sids:
            sio.emit("available-jobs", room=runner_socket_sid)


runner_socket = RunnerSocket("/runners")
sio.register_namespace(runner_socket)
