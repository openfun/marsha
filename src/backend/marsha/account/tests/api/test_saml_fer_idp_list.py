"""Tests for the SAML FER identity provider API list."""
from unittest import mock

from django.test import TestCase

from social_django.utils import load_backend, load_strategy
from social_edu_federation.django.metadata_store import CachedMetadataStore
from social_edu_federation.testing.saml_tools import (
    format_md_organization_display_name,
    format_md_organization_name,
    format_mdui_display_name,
    generate_idp_federation_metadata,
    generate_idp_metadata,
)


class MetadataUrlOpenMock:
    """Mocking object for the urlopen to fetch custom metadata."""

    entity_descriptor_list = [
        generate_idp_metadata(
            ui_info_display_names=format_mdui_display_name("Ze last in list"),
            organization_names=format_md_organization_name(
                "Ze last in list organization name"
            ),
            organization_display_names=format_md_organization_display_name(
                "Ze last in list organization display name"
            ),
        ),
        generate_idp_metadata(
            ui_info_display_names=format_mdui_display_name("Local accepting IdP"),
            organization_names=format_md_organization_name("Local organization name"),
            organization_display_names=format_md_organization_display_name(
                "Local organization display name"
            ),
        ),
        generate_idp_metadata(
            ui_info_display_names=format_mdui_display_name("Before in list"),
            organization_names=format_md_organization_name(
                "Before in list organization name"
            ),
            organization_display_names=format_md_organization_display_name(
                "Before in list organization display name"
            ),
        ),
    ]

    def read(self):
        """Allow object to be read several times."""
        return generate_idp_federation_metadata(
            entity_descriptor_list=self.entity_descriptor_list,
        ).encode("utf-8")


class SamlFerIdpListAPIViewTest(TestCase):
    """Testcase for the SAML FER identity provider API list."""

    maxDiff = None

    def setUp(self) -> None:
        """Set up tests."""
        super().setUp()

        # Force cache cleanup to use the mocked metadata
        strategy = load_strategy(None)
        backend = load_backend(strategy, "saml_fer", redirect_uri=None)
        CachedMetadataStore(backend).cache.clear()

    def test_list_get(self):
        """Test GET request on the list endpoint."""
        with mock.patch("urllib.request.urlopen") as urlopen_mock:
            urlopen_mock.return_value = MetadataUrlOpenMock()

            response = self.client.get(
                "/account/api/saml/renater_fer_idp_list/",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": "before-in-list",
                    "display_name": "Before in list",
                    "organization_name": "Before in list organization name",
                    "organization_display_name": "Before in list organization display name",
                    "logo": None,
                    "login_url": "http://testserver/account/login/saml_fer/?idp=before-in-list",
                },
                {
                    "id": "local-accepting-idp",
                    "display_name": "Local accepting IdP",
                    "organization_name": "Local organization name",
                    "organization_display_name": "Local organization display name",
                    "logo": None,
                    "login_url": (
                        "http://testserver/account/login/saml_fer/?idp=local-accepting-idp"
                    ),
                },
                {
                    "id": "ze-last-in-list",
                    "display_name": "Ze last in list",
                    "organization_name": "Ze last in list organization name",
                    "organization_display_name": "Ze last in list organization display name",
                    "logo": None,
                    "login_url": "http://testserver/account/login/saml_fer/?idp=ze-last-in-list",
                },
            ],
        )

    def test_list_get_with_filter(self):
        """Test GET request on the list endpoint with filter."""
        with mock.patch("urllib.request.urlopen") as urlopen_mock:
            urlopen_mock.return_value = MetadataUrlOpenMock()

            response = self.client.get(
                "/account/api/saml/renater_fer_idp_list/?q=loCal",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": "local-accepting-idp",
                    "display_name": "Local accepting IdP",
                    "organization_name": "Local organization name",
                    "organization_display_name": "Local organization display name",
                    "logo": None,
                    "login_url": (
                        "http://testserver/account/login/saml_fer/?idp=local-accepting-idp"
                    ),
                },
            ],
        )

        with mock.patch("urllib.request.urlopen") as urlopen_mock:
            urlopen_mock.return_value = MetadataUrlOpenMock()

            response = self.client.get(
                "/account/api/saml/renater_fer_idp_list/?q=List%20organiZation%20display",
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            [
                {
                    "id": "before-in-list",
                    "display_name": "Before in list",
                    "organization_name": "Before in list organization name",
                    "organization_display_name": "Before in list organization display name",
                    "logo": None,
                    "login_url": "http://testserver/account/login/saml_fer/?idp=before-in-list",
                },
                {
                    "id": "ze-last-in-list",
                    "display_name": "Ze last in list",
                    "organization_name": "Ze last in list organization name",
                    "organization_display_name": "Ze last in list organization display name",
                    "logo": None,
                    "login_url": "http://testserver/account/login/saml_fer/?idp=ze-last-in-list",
                },
            ],
        )
