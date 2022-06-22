"""Marsha {{cookiecutter.app_name}} app URLs configuration."""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .api import {{cookiecutter.model}}ViewSet
from .views import {{cookiecutter.model}}LTIView


app_name = "{{cookiecutter.app_name}}"

router = DefaultRouter()
router.register("{{cookiecutter.model_url_part}}", {{cookiecutter.model}}ViewSet, basename="{{cookiecutter.model_lower}}")

urlpatterns = [
    path("lti/{{cookiecutter.model_url_part}}/<uuid:uuid>", {{cookiecutter.model}}LTIView.as_view(), name="{{cookiecutter.model_lower}}_lti_view"),
    path("api/", include(router.urls)),
]
