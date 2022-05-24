"""SAML Metadata and response generators for SAML testing"""
import calendar
from datetime import datetime, timedelta
import uuid

from django.contrib.sites.models import Site
from django.urls import reverse

from onelogin.saml2.constants import OneLogin_Saml2_Constants
from onelogin.saml2.metadata import OneLogin_Saml2_Metadata
from onelogin.saml2.utils import OneLogin_Saml2_Utils
from onelogin.saml2.xml_utils import OneLogin_Saml2_XML
from signxml import XMLSigner

from .certificates import get_dev_certificate, get_dev_private_key


_AUTH_RESPONSE_TEMPLATE = """\
<?xml version="1.0" encoding="UTF-8"?>
<saml2p:Response ID="_885e05fc3bae1925e730e0e9d5c4e1cd"
    InResponseTo="{in_response_to}"
    IssueInstant="2022-05-17T13:00:29.472Z"
    Version="2.0"
    xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol"
>
    <saml2:Issuer xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion">{issuer}</saml2:Issuer>
    <saml2p:Status>
        <saml2p:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
    </saml2p:Status>
    <saml2:Assertion ID="_1ee4d12dc0a92300cfb40c8156157708"
        IssueInstant="2022-05-17T13:00:29.472Z" Version="2.0"
        xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    >
        <saml2:Issuer>{issuer}</saml2:Issuer>
        <ds:Signature
            xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
            Id="placeholder"
        ></ds:Signature>
        <saml2:Subject>
            <saml2:NameID
                Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient"
                NameQualifier="{issuer}"
                SPNameQualifier="marsha-fun"
                xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion"
            >
                AAdzZWNyZXQx8FkJgLzpWsL9G4Mauc9xXvhUvdKaxTH8l4KW488QIIcn++
                uJqZodQEnOPyQtB2vU3vNlXDdYkJCbS8q8ZWuGAqceE0Xzgq7ojC1c9jM=
            </saml2:NameID>
            <saml2:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
                <saml2:SubjectConfirmationData Address="62.35.89.32"
                    InResponseTo="{in_response_to}"
                    NotOnOrAfter="{valid_until}"
                    Recipient="{acs_url}"
                />
            </saml2:SubjectConfirmation>
        </saml2:Subject>
        <saml2:Conditions
            NotBefore="2022-05-17T13:00:29.472Z"
            NotOnOrAfter="{valid_until}"
        >
            <saml2:AudienceRestriction>
                <saml2:Audience>marsha-fun</saml2:Audience>
            </saml2:AudienceRestriction>
        </saml2:Conditions>
        <saml2:AuthnStatement
            AuthnInstant="2022-05-17T13:00:26.365Z"
            SessionIndex="_56c3b72bf3594719715df05ef75461f0"
        >
            <saml2:SubjectLocality Address="62.35.89.32"/>
            <saml2:AuthnContext>
                <saml2:AuthnContextClassRef>
                    urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport
                </saml2:AuthnContextClassRef>
            </saml2:AuthnContext>
        </saml2:AuthnStatement>
        <saml2:AttributeStatement>
            <saml2:Attribute
                FriendlyName="eduPersonPrincipalName"
                Name="urn:oid:1.3.6.1.4.1.5923.1.1.1.6"
                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"
            >
                <saml2:AttributeValue>{user_id}</saml2:AttributeValue>
            </saml2:Attribute>
            <saml2:Attribute
                FriendlyName="sn"
                Name="urn:oid:2.5.4.4"
                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"
            >
                <saml2:AttributeValue>Sanchez</saml2:AttributeValue>
            </saml2:Attribute>
            <saml2:Attribute
                FriendlyName="givenName"
                Name="urn:oid:2.5.4.42"
                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"
            >
                <saml2:AttributeValue>Rick</saml2:AttributeValue>
            </saml2:Attribute>
            <saml2:Attribute
                FriendlyName="displayName"
                Name="urn:oid:2.16.840.1.113730.3.1.241"
                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"
            >
                <saml2:AttributeValue>Rick Sanchez</saml2:AttributeValue>
            </saml2:Attribute>
            <saml2:Attribute
                FriendlyName="mail"
                Name="urn:oid:0.9.2342.19200300.100.1.3"
                NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"
            >
                <saml2:AttributeValue>rsanchez@samltest.id</saml2:AttributeValue>
            </saml2:Attribute>
        </saml2:AttributeStatement>
    </saml2:Assertion>
</saml2p:Response>
"""

_ENTITIES_DESCRIPTOR_TEMPLATE = """\
<?xml version="1.0" encoding="UTF-8"?>
<md:EntitiesDescriptor
    xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
    xmlns:eidas="http://eidas.europa.eu/saml-extensions"
    xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
    xmlns:mdattr="urn:oasis:names:tc:SAML:metadata:attribute"
    xmlns:mdrpi="urn:oasis:names:tc:SAML:metadata:rpi"
    xmlns:mdui="urn:oasis:names:tc:SAML:metadata:ui"
    xmlns:pyff="http://pyff.io/NS"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    xmlns:ser="http://eidas.europa.eu/metadata/servicelist"
    xmlns:shibmd="urn:mace:shibboleth:metadata:1.0"
    xmlns:xrd="http://docs.oasis-open.org/ns/xri/xrd-1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    Name="https://federation.renater.fr/"
    ID="_20220513T084031Z"
    validUntil="2022-05-22T08:40:31Z"
    cacheDuration="PT1H"
>
    {entity_descriptors}
</md:EntitiesDescriptor>
    """

_ENTITY_DESCRIPTOR_TEMPLATE = """\
<md:EntityDescriptor
    xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
    xmlns:mdui="urn:oasis:names:tc:SAML:metadata:ui"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    entityID="{entity_id}"
>
    <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:Extensions>
            <mdui:UIInfo>
                <mdui:DisplayName xml:lang="fr">{display_name_fr}</mdui:DisplayName>
                <mdui:Description xml:lang="fr">Some description</mdui:Description>
            </mdui:UIInfo>
        </md:Extensions>
        <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat>
        <md:SingleSignOnService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            Location="{sso_location}"
        />
    </md:IDPSSODescriptor>
    <md:Organization>
        <md:OrganizationName xml:lang="en">OrganizationName</md:OrganizationName>
        <md:OrganizationDisplayName xml:lang="en">OrganizationName</md:OrganizationDisplayName>
        <md:OrganizationURL xml:lang="en">https://organization.example.com/</md:OrganizationURL>
    </md:Organization>
    <md:ContactPerson contactType="technical">
        <md:EmailAddress>mailto:technical_contact_person@example.com</md:EmailAddress>
    </md:ContactPerson>
</md:EntityDescriptor>"""


def _add_x509_key_descriptors(metadata, cert) -> str:
    """Highly inspired from OneLogin_Saml2_Metadata.add_x509_key_descriptors"""
    root = OneLogin_Saml2_XML.to_etree(metadata)
    sp_sso_descriptor = next(
        root.iterfind(
            ".//md:IDPSSODescriptor", namespaces=OneLogin_Saml2_Constants.NSMAP
        )
    )
    # pylint:disable=protected-access
    OneLogin_Saml2_Metadata._add_x509_key_descriptors(sp_sso_descriptor, cert, False)
    OneLogin_Saml2_Metadata._add_x509_key_descriptors(sp_sso_descriptor, cert, True)
    # pylint:enable=protected-access
    return OneLogin_Saml2_XML.to_string(root).decode("utf-8")


def _full_reverse_url(url_name):
    """Helper to reverse URL including the full path"""
    # This is quite quick & dirty as we don't need it for production use
    domain = Site.objects.get_current().domain
    return f"http://{domain}{reverse(url_name)}"


def generate_idp_metadata(**kwargs):
    """Generates an Entity Descriptor metadata"""
    idp_config = {
        "entity_id": "http://marsha.example.com/adfs/services/trust",
        "display_name_fr": "Marsha local IdP",
        "sso_location": _full_reverse_url("account:idp_sso_login"),
    }
    idp_config.update(kwargs)

    metadata = _ENTITY_DESCRIPTOR_TEMPLATE.format(**idp_config)

    return _add_x509_key_descriptors(metadata, get_dev_certificate())


def generate_idp_federation_metadata(entity_descriptor_list=None):
    """Generate a look alike Renater Metadata"""
    entity_descriptor_list = entity_descriptor_list or [generate_idp_metadata()]
    joined_entity_descriptors = "\n".join(entity_descriptor_list)

    entities_descriptor_xml = _ENTITIES_DESCRIPTOR_TEMPLATE.format(
        entity_descriptors=joined_entity_descriptors,
    )

    return entities_descriptor_xml


def generate_auth_response(in_response_to, acs_url):
    """Generates an SAML authentication response."""
    response_attributes = {
        "in_response_to": in_response_to,
        "issuer": "http://marsha.example.com/adfs/services/trust",
        "entity_id": "http://marsha.example.com/adfs/services/trust",
        "acs_url": acs_url,
        "valid_until": OneLogin_Saml2_Utils.parse_time_to_SAML(
            calendar.timegm((datetime.utcnow() + timedelta(days=10)).utctimetuple())
        ),
        "user_id": str(uuid.uuid4()),
    }

    auth_response = _AUTH_RESPONSE_TEMPLATE.format(**response_attributes)

    # Sign response
    saml_root = OneLogin_Saml2_XML.to_etree(auth_response)
    xml_signer = XMLSigner(c14n_algorithm="http://www.w3.org/2001/10/xml-exc-c14n#")
    signed_saml = xml_signer.sign(
        saml_root,
        key=get_dev_private_key(),
        cert=get_dev_certificate(),
        reference_uri="_1ee4d12dc0a92300cfb40c8156157708",
    )

    return OneLogin_Saml2_XML.to_string(signed_saml).decode("utf-8")
