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


# social-edu-federation uses a default logo in metadata
DEFAULT_LOGO = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz3"
    "4AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29m"
    "dHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubX"
    "dtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJC"
    "KE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00"
    "YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHC"
    "hahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9k"
    "Lp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+q"
    "XkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMs"
    "OF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0"
    "eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8Qyq"
    "wZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjli"
    "thJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ek"
    "okRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6E"
    "hOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFw"
    "g59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+g"
    "qjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDF"
    "Nx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVO"
    "J3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HU"
    "tlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASU"
    "VORK5CYII="
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
            ui_info_display_names=format_mdui_display_name("local accepting IdP"),
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
                    "logo": DEFAULT_LOGO,
                    "login_url": "http://testserver/account/login/saml_fer/?idp=before-in-list",
                },
                {
                    "id": "local-accepting-idp",
                    "display_name": "local accepting IdP",
                    "organization_name": "Local organization name",
                    "organization_display_name": "Local organization display name",
                    "logo": DEFAULT_LOGO,
                    "login_url": (
                        "http://testserver/account/login/saml_fer/?idp=local-accepting-idp"
                    ),
                },
                {
                    "id": "ze-last-in-list",
                    "display_name": "Ze last in list",
                    "organization_name": "Ze last in list organization name",
                    "organization_display_name": "Ze last in list organization display name",
                    "logo": DEFAULT_LOGO,
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
                    "display_name": "local accepting IdP",
                    "organization_name": "Local organization name",
                    "organization_display_name": "Local organization display name",
                    "logo": DEFAULT_LOGO,
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
                    "logo": DEFAULT_LOGO,
                    "login_url": "http://testserver/account/login/saml_fer/?idp=before-in-list",
                },
                {
                    "id": "ze-last-in-list",
                    "display_name": "Ze last in list",
                    "organization_name": "Ze last in list organization name",
                    "organization_display_name": "Ze last in list organization display name",
                    "logo": DEFAULT_LOGO,
                    "login_url": "http://testserver/account/login/saml_fer/?idp=ze-last-in-list",
                },
            ],
        )
