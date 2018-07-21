from django.forms import ModelForm
from marsha.core.models.video import Video 

class VideoForm(ModelForm):

    class Meta:

        model = Video
        fields = ['name', 'description', 'language']