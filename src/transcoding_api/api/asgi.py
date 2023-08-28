"""
ASGI config for api project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

os.environ.setdefault("DJANGO_CONFIGURATION", "Development")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "api.settings")

from configurations.asgi import get_asgi_application  # noqa: E402

django_asgi_app = get_asgi_application()


# its important to make all other imports below this comment
import socketio  # noqa: E402

from socketio_app.views import sio  # noqa: E402

application = socketio.ASGIApp(sio, django_asgi_app)
