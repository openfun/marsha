from django.conf import settings
from django.core.files.storage import get_storage_class

video_storage = get_storage_class(settings.STORAGES["videos"]["BACKEND"])(
    settings.STORAGES["videos"]["OPTIONS"]["location"],
)
