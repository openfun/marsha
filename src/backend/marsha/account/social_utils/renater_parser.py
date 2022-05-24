"""
Marsha's utilities to parse Renater Federation Metadata XML.

This module is partially typed to ease the readability, since
it's not always obvious to know which object is manipulated.
"""

import datetime
import logging
from typing import Dict

from django.conf import settings
from django.core.cache import cache as default_cache

from onelogin.saml2.idp_metadata_parser import OneLogin_Saml2_IdPMetadataParser
from onelogin.saml2.xml_utils import OneLogin_Saml2_XML
from onelogin.saml2.xmlparser import tostring
from social_core.backends.saml import SAMLIdentityProvider
from social_core.utils import slugify


logger = logging.getLogger(__name__)


class RenaterCacheEntry:
    """
    Cache object to easily manage object storage in cache.

    This cache:
     - adds a namespace to the cached keys,
     - defines a cache duration of one day (the metadata validity),
       we add a minute to ensure the refreshing management command
       can pass again.
     -  uses the default defined cache (ie a failsafe Redis in production).
    """

    namespace = "renater_saml"
    duration = datetime.timedelta(hours=24, minutes=1).total_seconds()
    cache = default_cache  # Django default cache

    def __init__(self, entry_id):
        """Init the cache entry key"""
        self.entry_id = entry_id

    @classmethod
    def _namespaced_key(cls, key):
        """Returns a key for the cache entry."""
        return f"{cls.namespace}:{key}"

    @classmethod
    def set_many(cls, **kwargs):
        """
        Class method to update keys in cache by batch.

        Note: `RenaterCache` does not provide other "many keys" manipulation.
        This is on purpose, as we don't need this complexity here.
        """
        cls.cache.set_many(
            dict((cls._namespaced_key(key), value) for key, value in kwargs.items()),
            cls.duration,
        )

    @property
    def key(self):
        """Returns a key for the cache entry."""
        return self._namespaced_key(self.entry_id)

    def get(self):
        """Returns the cache entry value."""
        return self.cache.get(self.key)

    def set(self, value):
        """Store the cache entry value."""
        self.cache.set(self.key, value, self.duration)


def convert_identity_provider_to_saml_idp_class(
    identity_provider: dict,
) -> SAMLIdentityProvider:
    """
    Makes the conversion from the dictionary fetch by python3-saml
    to an object usable by Python Social Auth.

    Parameters
    ----------
    identity_provider : dict
        The identity provider we want to convert. Looks like:
        ```
        {
            'entityId': 'http://idp.domain/adfs/services/trust',
            'singleSignOnService': {
                'url': 'https://idp.domain/adfs/ls/',
                'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            },
            'singleLogoutService': {
                'url': 'https://idp.domain/adfs/ls/',
                'binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            },
            'x509cert': 'MIIC4DCCAcigAwIBAgIQG...CQZXu/agfMc/tY+miyrD0=',
            'display_name': 'IdP displayable name',
            'organization_name': 'Organization',
            'organization_display_name': 'Organization displayable name',
        }
        ```

    Returns
    -------
    Type[SAMLIdentityProvider]
        The object for Python Social Auth
    """
    return SAMLIdentityProvider(
        slugify(identity_provider["display_name"]),
        entity_id=identity_provider["entityId"],
        url=identity_provider.get("singleSignOnService", {}).get("url"),
        slo_url=identity_provider.get("singleLogoutService", {}).get("url"),
        x509cert=identity_provider.get("x509cert"),
        x509certMulti=identity_provider.get("x509certMulti"),
        #
        # Also store our own data in the SAMLIdentityProvider `conf`
        marsha_display_name=identity_provider["display_name"],
        marsha_organization_name=identity_provider["organization_name"],
        marsha_organization_display_name=identity_provider["organization_display_name"],
    )


def fetch_renater_metadata() -> bytes:
    """
    Fetches the Renater Metadata remotely.
    As Python Social Auth relies on python3-saml we re-use it here.

    `OneLogin_Saml2_IdPMetadataParser` take care for us to check
    the metadata signature.
    """
    return OneLogin_Saml2_IdPMetadataParser.get_metadata(
        settings.SOCIAL_AUTH_RENATER_SAML_METADATA,
        timeout=10,
    )


def get_xml_node_text(dom, query, default=None):
    """
    Extracts the text part of the first node from the `dom` that
    matches the `query`.
    """
    nodes = OneLogin_Saml2_XML.query(dom, query)
    if nodes:
        return OneLogin_Saml2_XML.element_text(nodes[0])
    return default


def parse_renater_metadata(xml_content: bytes) -> Dict[str, SAMLIdentityProvider]:
    """
    Parses the Renater federation metadata to extract all Identity Providers.
    As Python Social Auth relies on python3-saml we re-use it here.

    `python3-saml` does not allow to extract all the IdP at one, hence the loop
    with reconversion from `ElementTree` to bytes to be allowed to re-use
    `python3-saml` for each IdP parsing.

    We also need more fields than only the technical ones: we fetch
    the French University name.

    Parameters
    ----------
    xml_content : bytes
        The content of the metadata.

    Returns
    -------
    dict
        This returns a dict of all the `SAMLIdentityProvider`:
        ```
        {
            idp-university-1: <SAMLIdentityProvider instance>
        }
        ```
    """
    identity_providers = {}
    metadata = OneLogin_Saml2_XML.to_etree(xml_content)
    for entity_descriptor in OneLogin_Saml2_XML.query(
        metadata, "//md:EntityDescriptor"
    ):
        # Convert the entity descriptor to string again...
        # Not optimal, but python3-saml only allow to fetch one entity in the metadata.
        entity_descriptor_bytes = tostring(
            entity_descriptor, encoding="utf8", method="xml"
        )
        #
        # Query common IdP metadata
        entity_dict = OneLogin_Saml2_IdPMetadataParser.parse(entity_descriptor_bytes)[
            "idp"
        ]
        #
        # Query extra metadata for our own needs
        # - Requires mdui namespace added in apps.AccountConfig.ready
        # - Query the display name, prefer "fr", but fallback on any
        #   and fallback on Entity ID if none found.
        display_name_fr = get_xml_node_text(
            entity_descriptor,
            './md:IDPSSODescriptor/md:Extensions/mdui:UIInfo/mdui:DisplayName[@xml:lang="fr"]',
        )
        default_display_name = get_xml_node_text(
            entity_descriptor,
            "./md:IDPSSODescriptor/md:Extensions/mdui:UIInfo/mdui:DisplayName",
        )
        entity_dict["display_name"] = (
            display_name_fr or default_display_name or entity_dict["entityId"]
        )
        # - Fetch organization information
        entity_dict["organization_name"] = get_xml_node_text(
            entity_descriptor,
            "./md:Organization/md:OrganizationName",
        )
        entity_dict["organization_display_name"] = get_xml_node_text(
            entity_descriptor,
            "./md:Organization/md:OrganizationDisplayName",
        )

        # Store all the necessary data
        saml_idp = convert_identity_provider_to_saml_idp_class(entity_dict)
        identity_providers[str(saml_idp.name)] = saml_idp

    return identity_providers


def get_all_renater_identity_providers() -> Dict[str, SAMLIdentityProvider]:
    """
    Retrieve the Renater's metadata and return as Python Social Auth objects.

    This call the metadata endpoint and parse values.

    Returns
    -------
    dict
        This returns a dict of all the `SAMLIdentityProvider`:
        ```
        {
            idp-university-1: <SAMLIdentityProvider instance>
        }
        ```
    """
    xml_metadata = fetch_renater_metadata()
    return parse_renater_metadata(xml_metadata)


def update_renater_identity_providers_cache() -> Dict[str, SAMLIdentityProvider]:
    """
    Store the Renater's metadata in cache.

    Returns
    -------
    dict
        This returns a dict of all the `SAMLIdentityProvider`:
        ```
        {
            idp-university-1: <SAMLIdentityProvider instance>
        }
        ```
    """
    # Fetch up-to-date data
    all_renater_idps = get_all_renater_identity_providers()

    # Store the IdP list
    available_idp_list_cache_entry = RenaterCacheEntry("available_idp_list")
    idp_choices = list(
        (idp.name, idp.conf["marsha_display_name"]) for idp in all_renater_idps.values()
    )
    available_idp_list_cache_entry.set(idp_choices)

    # Store each IdP information
    RenaterCacheEntry.set_many(**all_renater_idps)

    return all_renater_idps


def get_all_renater_idp_choices() -> list:
    """
    Get a list of all Renater's Identity Providers for display purpose.

    This list is used to display a list of available IdP to users who want to login.
    The function will try to load values from the cache,
    if empty we try to fill all the cache again, because
    the `get_renater_idp` function will probably be called
    soon after.

    Returns
    -------
    list
        This returns a list of tuple containing the Idp technical
        name, and the Idp displayable name:
        ```
        [
            (idp-university-1, "Number one university"),
        ]
        ```
    """
    cache_entry = RenaterCacheEntry("available_idp_list")
    idp_choices = cache_entry.get()

    if idp_choices is None:
        logger.warning("Fetching the Renater metadata again")
        all_renater_idps = update_renater_identity_providers_cache()
        idp_choices = list(
            (idp.name, idp.conf["marsha_display_name"])
            for idp in all_renater_idps.values()
        )

    return idp_choices


def get_renater_idp(idp_name: str) -> SAMLIdentityProvider:
    """
    Get an Identity Provider configuration.

    Parameters
    ----------
    idp_name : str
        The Identity Provider technical name.

    Returns
    -------
    Type[SAMLIdentityProvider]
        The Identity Provider configuration as a Python Social Auth object.
    """
    cache_entry = RenaterCacheEntry(idp_name)
    idp_configuration = cache_entry.get()

    if idp_configuration is None:
        logger.warning("Fetching the Renater metadata again")
        all_renater_idps = update_renater_identity_providers_cache()
        idp_configuration = all_renater_idps[idp_name]

    return idp_configuration
