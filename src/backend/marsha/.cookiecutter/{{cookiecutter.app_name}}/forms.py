"""Marsha forms module."""
from django.forms import ModelForm

from . import models


class {{cookiecutter.model}}Form(ModelForm):
    """Form to create or update {{cookiecutter.model_plural_lower}}."""

    class Meta:
        """Meta for {{cookiecutter.model}}Form."""

        model = models.{{cookiecutter.model}}
        fields = ["description", "lti_id", "playlist", "title"]
