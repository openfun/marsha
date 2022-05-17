"""Admin site definition of the Marsha project."""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _


class MarshaAdminSite(admin.AdminSite):
    """Admin site for Marsha."""

    site_title = _("Marsha administration")
    site_header = "Marsha"
