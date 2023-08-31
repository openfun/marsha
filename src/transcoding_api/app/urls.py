from django.contrib import admin
from django.urls import path

from transcode_api.urls import urlpatterns as transcode_api_urls

urlpatterns = [
    path("admin/", admin.site.urls),
]
urlpatterns += transcode_api_urls
