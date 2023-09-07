from django.contrib import admin
from django.urls import path

from django_peertube_runner_connector.urls import urlpatterns as django_peertube_runner_connector_urls

urlpatterns = [
    path("admin/", admin.site.urls),
]
urlpatterns += django_peertube_runner_connector_urls
