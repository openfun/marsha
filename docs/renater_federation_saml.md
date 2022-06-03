### Renater "Féderation Éducation-Recherche" federation use

Marsha allows to use external Identity Provider from the "Féderation Éducation-Recherche"
using the [Renater Federation](https://services.renater.fr/federation/introduction/index)


#### Marsha configuration

There are few settings to define in order to make marsha compliant with SAMLv2 authentication.

You will need to provide following environment variables:
- `DJANGO_SOCIAL_AUTH_SAML_FER_SP_ENTITY_ID`:  The Marsha's entity ID, it may only be its
  metadata URL.
- `DJANGO_SOCIAL_AUTH_SAML_FER_SP_PUBLIC_CERT`: Marsha's X.509 public certificate.
- `DJANGO_SOCIAL_AUTH_SAML_FER_SP_PRIVATE_KEY`: Marsha's private key associated with
  the certificate.
- `DJANGO_SOCIAL_AUTH_SAML_FER_FEDERATION_SAML_METADATA_URL`: The URL of the
  Renater FER federation metadata.
- `DJANGO_SOCIAL_AUTH_SAML_FER_ORG_INFO_NAME`: The organization's name
- `DJANGO_SOCIAL_AUTH_SAML_FER_ORG_INFO_DISPLAY_NAME`: The organization's display name
- `DJANGO_SOCIAL_AUTH_SAML_FER_ORG_INFO_URL`: The organization's website
- `DJANGO_SOCIAL_AUTH_SAML_FER_TECHNICAL_CONTACT_NAME`: The name of the technical
  team maintaining the SAML configuration.
- `DJANGO_SOCIAL_AUTH_SAML_FER_TECHNICAL_CONTACT_EMAIL`: The email of the technical team.
- `DJANGO_SOCIAL_AUTH_SAML_FER_SUPPORT_CONTACT_NAME`: The user support team name.
- `DJANGO_SOCIAL_AUTH_SAML_FER_SUPPORT_CONTACT_EMAIL`: The user support team email address.


#### Security

By default, Marsha is quite strict with SAML required specification:
 - Marsha signs its authentication requests
 - Marsha signs its metadata
 - Marsha expects message to be signed in the authentication response
 - Marsha expects assertion to be signed in the authentication response
 - Marsha expects assertion to be encrypted in the authentication response
 - Marsha rejects deprecated algorithms

These values are editable using following environment variables respectively:
- `DJANGO_SOCIAL_AUTH_SAML_FER_SECURITY_CONFIG_AUTH_REQUEST_SIGNED`
- `DJANGO_SOCIAL_AUTH_SAML_FER_SECURITY_CONFIG_SIGN_METADATA`
- `DJANGO_SOCIAL_AUTH_SAML_FER_SECURITY_CONFIG_WANT_MESSAGES_SIGNED`
- `DJANGO_SOCIAL_AUTH_SAML_FER_SECURITY_CONFIG_WANT_ASSERTIONS_SIGNED`
- `DJANGO_SOCIAL_AUTH_SAML_FER_SECURITY_CONFIG_WANT_ASSERTIONS_ENCRYPTED`
- `DJANGO_SOCIAL_AUTH_SAML_FER_SECURITY_CONFIG_REJECT_DEPRECATED_ALGORITHM`

For instance, if the federation identity providers cannot encrypt the response assertions,
you may deploy marsha using:

```shell
DJANGO_SOCIAL_AUTH_SAML_FER_SECURITY_CONFIG_WANT_ASSERTIONS_ENCRYPTED=false
```

#### Marsha's metadata

Once marsha is configured, you may access to its SAML metadata on
`https://<your_domain>/account/saml/metadata/`.


#### Authentication response used attributes

Marsha uses the following SAML attributes to extract information about users:
 - `urn:oid:1.3.6.1.4.1.5923.1.1.1.6` (eduPersonPrincipalName)
   globally unique, using the format <user>@<institution> is the unique identifier
   for marsha to know the user has already logged in through this IdP.
 - `urn:oid:2.5.4.4` (sn) aka (surname) and `urn:oid:2.5.4.42` (givenName) aka (gn)
   we try to get the user first name and last name, if any is missing
   we fallback on the full name field, see after.
 - `urn:oid:2.16.840.1.113730.3.1.241` (displayName)
   This represents the user full name, only used when not both first and last
   names are available. This is stored in the user last name field.
 - `urn:oid:0.9.2342.19200300.100.1.3` (mail)
   Provides us the user email, we use it as email address and username.
 - `urn:oid:1.3.6.1.4.1.5923.1.1.1.1` (eduPersonAffiliation)
   Allows use to try to determine the role (student/professor).
   This is not mandatory, but may help to autofill the role.
   We default to student.


#### Testing configuration

In development environment, Marsha loads testing settings which allows to simulate
an SAML authentication loop locally. All the tools to make this possible are
available in the `social_edu_federation.django.testing` module.
