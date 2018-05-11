"""WSGI script for the marsha project."""

from configurations.wsgi import get_wsgi_application


application = get_wsgi_application()  # pylint: disable=invalid-name
