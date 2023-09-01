from django.conf import settings
from django.core.files import storage

video_storage = storage.get_storage_class(settings.STORAGES["videos"]["BACKEND"])(
    settings.STORAGES["videos"]["OPTIONS"]["location"],
)
