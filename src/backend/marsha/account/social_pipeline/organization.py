"""Marsha's specific Python Social Auth pipeline steps for Organization"""
import logging

from django.conf import settings
from django.db import IntegrityError
from django.db.transaction import atomic

from marsha.account.models import IdpOrganizationAssociation
from marsha.core.models import INSTRUCTOR, STUDENT, Organization, OrganizationAccess


logger = logging.getLogger(__name__)


@atomic()
def create_organization_from_saml(  # pylint:disable=too-many-arguments
    strategy,  # pylint:disable=unused-argument
    details,
    backend,
    *args,
    user=None,
    response=None,
    new_association=None,
    **kwargs
):
    """
    Creates the Organization if not exising and links
    the authenticated user to it.
    This does nothing if the user is already known
    (it supposes the association has already been done).

    Parameters
    ----------
    strategy : Type[DjangoStrategy]
        The Python Social Auth strategy (defined by Django Social Auth)

    details : dict
        The normalized attributes extracted from the authentication response.

        ```
        {
            'first_name': 'Rick',
            'last_name': 'Sanchez',
            'username': 'rsanchez@samltest.id',
            'email': 'rsanchez@samltest.id',
            'role': "",
        }
        ```

    backend : Type[RenaterShibbolethSAMLAuth]
        The authentication backend currently used for the pipeline

    user : Type[User]
        The marsha user object

    response : dict
        The authentication response parsed as a dictionary

        ```
        {
            'idp_name': 'marsha-local-idp',
            'attributes': {
                'urn:oid:1.3.6.1.4.1.5923.1.1.1.6': ['21d8ab77-641e-420e-a420-c84cc59ddd93'],
                'urn:oid:2.5.4.4': ['Sanchez'],
                'urn:oid:2.5.4.42': ['Rick'],
                'urn:oid:2.16.840.1.113730.3.1.241': ['Rick Sanchez'],
                'urn:oid:0.9.2342.19200300.100.1.3': ['rsanchez@samltest.id'],
                'name_id': 'AAdzZWNyZXQx8FkJgLzpWsL9Nl8ZWuGAqceE0Xzgq7ojC1c9jM='
            },
            'session_index': '_56c3b72bf3594719715df05ef75461f0'
        }
        ```

    new_association : Optional[bool]
        Whether the user logs in with this provider for the first time.
        If `None` a previous mandatory step in the pipeline has not been run.

    args : tuple
        No argument provided for now

    kwargs : dict
        Other unused keyword arguments, may look like:

        ```
        {
            'storage': <class 'social_django.models.DjangoStorage'>,
            'is_new': True,
            'request': <ASGIRequest: POST '/account/complete/renater_saml/'>,
            'pipeline_index': 9,
            'uid': "marsha-local-idp:['21d8ab77-641e-420e-a420-c84cc59ddd93']",
            'social': <UserSocialAuth>,
            'username': 'rsanchez@samltest'
        }
        ```
    """
    # Get the organization name from the metadata
    idp = backend.get_idp(response["idp_name"])

    if new_association is None:
        raise RuntimeError(
            "'marsha.account.pipeline.organization.create_organization' must be"
            "called after 'social_core.pipeline.social_auth.social_user' please "
            "check your pipeline setting."
        )
    if not new_association:
        # Only associate to Organization for new user.
        return

    try:
        association = IdpOrganizationAssociation.objects.select_related(
            "organization"
        ).get(idp_identifier=idp.entity_id)
    except IdpOrganizationAssociation.DoesNotExist:
        organization, _created = Organization.objects.get_or_create(
            name=idp.conf["edu_fed_organization_display_name"],
        )
        association = IdpOrganizationAssociation.objects.create(
            idp_identifier=idp.entity_id,
            organization=organization,
        )

    # Don't fail if `new_association` but the OrganizationAccess already exists.
    # Spare 3 requests by not using get_or_create, as we don't need the get
    logger.info(
        "Creating OrganizationAccess for user %s and organization %s with role %s",
        user.pk,
        association.organization,
        details.get("roles", None),
    )
    try:
        OrganizationAccess.objects.create(
            user=user,
            organization=association.organization,
            role=INSTRUCTOR
            if (
                details.get("roles", None)
                and any(
                    role in details["roles"]
                    for role in settings.SOCIAL_AUTH_SAML_FER_TEACHER_ROLES
                )
            )
            else STUDENT,
        )
    except IntegrityError:
        pass
