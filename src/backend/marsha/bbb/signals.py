"""Defines the django app config for the ``page`` app."""

from django.dispatch import receiver

from marsha.bbb.models import ClassroomRecording
from marsha.bbb.utils import bbb_utils
from marsha.core.api import signal_object_uploaded
from marsha.core.models import Video


@receiver(signal_object_uploaded)
def object_uploaded_callback(**kwargs):
    """
    Callback answering the "object uploaded" signal.
    When a vod is created from BBB recordings, we should then
    delete recordings on the BBB API that are no more needed.
    """
    instance = kwargs.get("instance")
    if isinstance(instance, Video):
        recording = ClassroomRecording.objects.filter(vod__id=instance.id).first()
        if recording:
            bbb_utils.delete_recording([recording])
