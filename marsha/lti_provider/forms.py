"""Forms for the ``lti_provider`` app of the Marsha project."""

from django.forms import ModelForm

from marsha.core.models.video import Video


class VideoForm(ModelForm):
    """Form for video model should be filled by the instructor to create or modify a video."""

    class Meta:
        """Specify the fields of the form."""

        model = Video
        fields = ["name", "description", "language"]
