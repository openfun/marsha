"""Marsha forms module."""
from django.forms import CharField, ModelForm

from django_peertube_runner_connector.models import Runner


class RunnerForm(ModelForm):
    """Form to create or update classrooms."""

    name = CharField(required=True, max_length=255)
    registrationToken = CharField(required=True, max_length=255)
    description = CharField(required=False, max_length=255)

    class Meta:
        """Meta for RunnerForm."""

        model = Runner
        fields = ["name", "description", "registrationToken"]
