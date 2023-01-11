"""Declare development views."""
from logging import getLogger
import mimetypes
import os
from pathlib import Path
from urllib.parse import urlparse
import uuid

from django.conf import settings
from django.http import FileResponse, Http404
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import TemplateView

from faker import Faker

from ..bbb.models import Classroom
from ..core.models import Document, Playlist, Video
from ..core.models.account import ConsumerSite, LTIPassport
from ..deposit.models import FileDepository
from ..markdown.models import MarkdownDocument


logger = getLogger(__name__)
fake = Faker()


@method_decorator(csrf_exempt, name="dispatch")
@method_decorator(xframe_options_exempt, name="dispatch")
class DevelopmentLTIView(TemplateView):
    """A development view with iframe POST / plain POST helpers.

    Not available outside of DEBUG = true environments.

    """

    template_name = "development/lti_development.html"

    def get_context_data(self, **kwargs):
        """Generate a UUID to pre-populate the `uuid` fields in the LTI request form.

        Parameters
        ----------
        kwargs : dictionary
            keyword extra arguments

        Returns
        -------
        dictionary
            context for template rendering

        """
        domain = self.request.build_absolute_uri("/").split("/")[2]

        # use the HTTP_REFERER like to be consistent with the LTI passport
        request_domain = urlparse(self.request.build_absolute_uri("/")).hostname
        try:
            consumer_site = ConsumerSite.objects.get(domain=request_domain)
        except ConsumerSite.DoesNotExist:
            consumer_site, _ = ConsumerSite.objects.get_or_create(
                domain=request_domain, name=request_domain
            )

        if not (
            playlist := Playlist.objects.filter(consumer_site=consumer_site)
            .order_by("-created_on")
            .first()
        ):
            playlist, _ = Playlist.objects.get_or_create(
                consumer_site=consumer_site, title=domain, lti_id=domain
            )

        passport, _ = LTIPassport.objects.get_or_create(playlist=playlist)

        if settings.BYPASS_LTI_VERIFICATION:
            oauth_dict = {
                "oauth_consumer_key": passport.oauth_consumer_key,
            }
        else:
            oauth_dict = {
                "oauth_consumer_key": passport.oauth_consumer_key,
                "oauth_timestamp": "",
                "oauth_nonce": "",
                "oauth_signature": "",
                "oauth_version": "",
                "oauth_signature_method": "",
            }

        email = fake.email(safe=False)

        return {
            "domain": domain,
            "resource_link_id": fake.bs(),
            "user_id": fake.md5(),
            "lis_result_sourcedid": email.split("@")[0],
            "lis_person_contact_email_primary": email,
            "uuid": uuid.uuid4(),
            "select_context_id": playlist.lti_id,
            "select_content_item_return_url": self.request.build_absolute_uri(
                reverse("development:lti-development-view")
            ),
            "oauth_dict": oauth_dict,
            "last_objects": {
                "videos": Video.objects.filter(playlist=playlist).order_by(
                    "-updated_on"
                )[:5],
                "documents": Document.objects.filter(playlist=playlist).order_by(
                    "-updated_on"
                )[:5],
                "classrooms": Classroom.objects.filter(playlist=playlist).order_by(
                    "-updated_on"
                )[:5],
                "markdown-documents": MarkdownDocument.objects.filter(
                    playlist=playlist
                ).order_by("-updated_on")[:5],
                "deposits": FileDepository.objects.filter(playlist=playlist).order_by(
                    "-updated_on"
                )[:5],
            },
        }

    # pylint: disable=unused-argument
    def post(self, request, *args, **kwargs):
        """Respond to POST request.

        Context populated with POST request.

        Parameters
        ----------
        request : Request
            passed by Django
        args : list
            positional extra arguments
        kwargs : dictionary
            keyword extra arguments

        Returns
        -------
        HTML
            generated from applying the data to the template

        """
        return self.render_to_response({"content_selected": self.request.POST})


def service_worker_view(request):
    """
    View only serving the service worker at the marsha root domain in development
    only.
    """
    service_worker_path = Path(
        os.path.join(
            settings.BASE_STATIC_DIR,
            "js",
            "build",
            "service-worker.js",
        )
    )

    if not service_worker_path.exists():
        raise Http404("service-worker.js is not built. Built front LTI app first")

    content_type, encoding = mimetypes.guess_type(str(service_worker_path))

    response = FileResponse(service_worker_path.open("rb"), content_type=content_type)
    if encoding:
        response.headers["Content-Encoding"] = encoding

    return response
