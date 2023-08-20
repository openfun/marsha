from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from socketio import Namespace, Server
from socketio.exceptions import ConnectionRefusedError

if TYPE_CHECKING:
    from transcodingapi.transcoding.models import Runner

import json

from channels.generic.websocket import WebsocketConsumer

from .helpers.decorator import debounce

logger = logging.getLogger(__name__)

sio = Server(async_mode="threading")


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


class SocketConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        data = json.loads(text_data)
        if data["event"] == "my_event":
            self.handle_my_event(data["data"])

    def handle_my_event(self, data):
        # Handle the event data
        self.send(
            json.dumps({"event": "my_response", "data": {"message": "Event received"}})
        )
