"""Marsha's specific Python Social Auth pipeline steps for Playlist."""

from django.conf import settings
from django.db.transaction import atomic

from marsha.account.models import IdpOrganizationAssociation
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, Playlist, PlaylistAccess


@atomic()
def create_playlist_from_saml(  # pylint:disable=too-many-arguments
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
    Creates a default playlist for a newly created user.
    If the user already exists nothing is made

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
    if not new_association:
        # Only create a new playlist for new user association.
        return

    is_instructor = details.get("roles", None) and any(
        role in details["roles"] for role in settings.SOCIAL_AUTH_SAML_FER_TEACHER_ROLES
    )

    # If the user has no instructor role we don't create a new playlist.
    if not is_instructor:
        return

    idp = backend.get_idp(response["idp_name"])

    try:
        association = IdpOrganizationAssociation.objects.select_related(
            "organization"
        ).get(idp_identifier=idp.entity_id)
    except IdpOrganizationAssociation.DoesNotExist as idp_orga_does_not_exists:
        raise RuntimeError(
            "'marsha.account.pipeline.playlist.create_playlist_from_saml' must be"
            "called after 'marsha.account.pipeline.organization.create_organization_from_saml'"
            " please check your pipeline setting."
        ) from idp_orga_does_not_exists

    # If a playlist access exists for the user, don't create a new one
    # The process can be stopped here
    if PlaylistAccess.objects.filter(
        user=user,
        playlist__organization=association.organization,
        role__in=[ADMINISTRATOR, INSTRUCTOR],
    ).exists():
        return

    playlist = Playlist.objects.create(
        organization=association.organization,
        title=user.get_full_name() or user.username,
        created_by=user,
    )
    PlaylistAccess.objects.create(playlist=playlist, user=user, role=ADMINISTRATOR)
