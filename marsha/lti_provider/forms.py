from django.forms import ModelForm
from marsha.core.models.video import Video 

class VideoForm(ModelForm):

    """
    A video form that should be filled by the instructor in order to create or modify a video
    """

    class Meta:

        model = Video
        fields = ['name', 'description', 'language']
