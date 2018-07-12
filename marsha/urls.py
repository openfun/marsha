"""Marsha URLs configuration."""

from typing import Iterable

from django.urls import path
from django.conf.urls import url,include

from marsha.core.admin import admin_site


urlpatterns: Iterable[path] = [
        path(f"{admin_site.name}/", admin_site.urls),
        url(r'^lti/', include('marsha.lti_provider.urls'))
]
