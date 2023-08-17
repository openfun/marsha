"""Factories for the Marsha JWTs module"""
import types
import uuid

from django.conf import settings

import factory
from faker.utils.text import slugify
from rest_framework_simplejwt.exceptions import TokenError

from marsha.core.factories import ConsumerSiteFactory, LiveSessionFactory, UserFactory
from marsha.core.models import (
    ADMINISTRATOR,
    INSTRUCTOR,
    LTI_ROLES,
    NONE,
    STUDENT,
    Playlist,
)
from marsha.core.simple_jwt.permissions import PlaylistAccessPermissions
from marsha.core.simple_jwt.tokens import (
    ChallengeToken,
    LTIUserToken,
    PlaylistAccessToken,
    UserAccessToken,
)


class BaseTokenFactory(factory.Factory):
    """
    Base factory for JWT classes.

    Can be used to build payload directly (not recommended
    since the JWT payload may change without the factory
    being updated...), this can be useful to reduce the database
    objects creation (a user in the example bellow).
    ```
    class ExampleTokenFactory(BaseTokenFactory):
        user = factory.Dict({
            "id": factory.Faker("uuid4"),
        })

        class Meta:
            model = UserAccessToken

    token = ExampleTokenFactory()
    # token.payload["user"] = {"id": "204d0484-0ceb-11ed-afce-576d78a3588b"}
    ```

    Or can be used to call the JWT class method which usually create the token:
    ```
    class ExampleTokenFactory(BaseTokenFactory):
        user = factory.SubFactory(UserFactory)

        class Meta:
            model = UserAccessToken.for_user  # expects a `user` argument

    token = ExampleTokenFactory()
    # token.payload["user"] = {"id": user.pk}
    ```
    """

    class Meta:  # pylint:disable=missing-class-docstring
        abstract = True

    @classmethod
    def _build(cls, model_class, *args, **kwargs):
        """Build the JWT from the factory attributes. See class docstring above."""
        if args:
            # Accepts only kwargs to prevent wrong argument order
            raise ValueError(
                f"BaseTokenFactory {cls} does not support Meta.inline_args."
            )

        # When the model_class points directly to the class method we call it straightaway
        if isinstance(model_class, types.MethodType):
            token = model_class(**kwargs)
        else:  # Otherwise, we manually populate the payload
            token = cls._build_payload(model_class, **kwargs)

        token.verify()
        return token

    @classmethod
    def _build_payload(cls, model_class, **kwargs):
        """Populate the JWT's payload from the factory attributes."""
        token = model_class()
        token.payload.update(**kwargs)
        return token

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Inherited from parent class, boilerplate to the "build" method."""
        return cls._build(model_class, *args, **kwargs)


class UserAccessTokenFactory(BaseTokenFactory):
    """UserAccessToken factory, this creates a User if not provided."""

    user = factory.SubFactory(UserFactory)

    class Meta:  # pylint:disable=missing-class-docstring
        model = UserAccessToken.for_user


class ChallengeTokenFactory(BaseTokenFactory):
    """ChallengeToken factory, this creates a User if not provided."""

    user = factory.SubFactory(UserFactory)

    class Meta:  # pylint:disable=missing-class-docstring
        model = ChallengeToken.for_user


class PlaylistPermissionsFactory(factory.DictFactory):
    """Factory for playlist access permissions."""

    can_access_dashboard = False
    can_update = False

    class Meta:  # pylint:disable=missing-class-docstring
        model = PlaylistAccessPermissions

    @classmethod
    def _build(cls, model_class, *args, **kwargs):
        """Build permissions from the dataclass to enforce consistency."""
        permissions = super()._build(model_class, *args, **kwargs)
        return permissions.as_dict()


class BasePlaylistTokenFactory(BaseTokenFactory):
    """
    Base class for all playlist token factories.
    This forces to provide a playlist to forge the JWT,
    or nothing to use a random UUID.
    """

    @staticmethod
    def get_playlist_id(params):
        """Ensure the resource is a playlist."""
        resource_id = uuid.uuid4()
        if not params.resource:
            pass
        elif isinstance(params.resource, Playlist):
            resource_id = params.resource.id
        else:
            raise TokenError("resource is not a playlist")

        return str(resource_id)

    resource_id = factory.LazyAttribute(get_playlist_id)

    class Meta:  # pylint:disable=missing-class-docstring
        abstract = True

    class Params:  # pylint:disable=missing-class-docstring
        resource = None


class PlaylistAccessTokenFactory(BasePlaylistTokenFactory):
    """Simple playlist token. Looks like a public playlist token."""

    session_id = factory.Faker("uuid4")

    class Meta:  # pylint:disable=missing-class-docstring
        model = PlaylistAccessToken.for_resource_id


class LTIPlaylistAccessTokenFactory(BasePlaylistTokenFactory):
    """
    LTI playlist forged token.

    This token's payload is forged to remove a heavy call to
    `generate_passport_and_signed_lti_parameters` each time
    we want to have an LTI token.
    """

    # for_resource_id payload
    session_id = factory.Faker("uuid4")
    permissions = factory.SubFactory(PlaylistPermissionsFactory)
    roles = factory.fuzzy.FuzzyChoice(
        [ADMINISTRATOR, INSTRUCTOR, STUDENT, NONE],
        getter=lambda x: [x],
    )
    locale = factory.fuzzy.FuzzyChoice(settings.REACT_LOCALES)
    maintenance = factory.fuzzy.FuzzyChoice([True, False])

    # for_lti specific parameters
    context_id = factory.Faker("uuid4")
    consumer_site = factory.Faker("uuid4")

    # user details
    user = factory.Dict(
        {
            "id": factory.Faker("uuid4"),
            "user_fullname": factory.Faker("name"),
            "email": factory.LazyAttribute(lambda o: f"{o.username}@example.org"),
            "username": factory.LazyAttribute(lambda o: slugify(o.user_fullname)),
        }
    )

    class Meta:  # pylint:disable=missing-class-docstring
        model = PlaylistAccessToken


class StudentLtiTokenFactory(LTIPlaylistAccessTokenFactory):
    """LTI playlist forged token for student."""

    roles = factory.fuzzy.FuzzyChoice(LTI_ROLES.get(STUDENT), getter=lambda x: [x])


class InstructorOrAdminLtiTokenFactory(LTIPlaylistAccessTokenFactory):
    """
    LTI playlist forged token for instructor or administrators.
    See `marsha.core.views.BaseLTIView`.

    Note: the `can_update` permission is set to True
    to mean "the LTI request context ID is the playlist playlist LTI ID".
    When this is not the case, the test must explicitly add `permissions__can_update=False`.
    """

    roles = factory.fuzzy.FuzzyChoice([ADMINISTRATOR, INSTRUCTOR], getter=lambda x: [x])
    permissions = factory.SubFactory(
        PlaylistPermissionsFactory,
        can_access_dashboard=True,
        can_update=True,
    )


class LiveSessionPlaylistAccessTokenFactory(BaseTokenFactory):
    """Generates a playlist access token from a live session."""

    live_session = factory.SubFactory(LiveSessionFactory)
    session_id = factory.Faker("uuid4")

    class Meta:  # pylint:disable=missing-class-docstring
        model = PlaylistAccessToken.for_live_session


class LiveSessionLtiTokenFactory(LTIPlaylistAccessTokenFactory):
    """
    Prefer the use of LiveSessionPlaylistAccessTokenFactory,
    but this one allows to deeply customize the final JWT.
    """

    resource_id = factory.LazyAttribute(lambda o: str(o.live_session.video.playlist.id))
    roles = factory.fuzzy.FuzzyChoice([STUDENT, NONE], getter=lambda x: [x])

    consumer_site = factory.LazyAttribute(
        lambda o: str(o.live_session.consumer_site.id)
    )
    context_id = factory.LazyAttribute(lambda o: str(o.live_session.lti_id))

    user = factory.Dict(
        {
            "id": factory.SelfAttribute("..live_session.lti_user_id"),
            "username": factory.SelfAttribute("..live_session.username"),
            "email": factory.SelfAttribute("..live_session.email"),
        }
    )

    class Meta:  # pylint:disable=missing-class-docstring
        model = PlaylistAccessToken

    class Params:  # pylint:disable=missing-class-docstring
        live_session = factory.SubFactory(
            LiveSessionFactory,
            is_from_lti_connection=True,
        )
        any_role = factory.Trait(
            roles=factory.fuzzy.FuzzyChoice(
                [ADMINISTRATOR, INSTRUCTOR, STUDENT, NONE],
                getter=lambda x: [x],
            )
        )


class LTIUserTokenFactory(BaseTokenFactory):
    """
    LTI User for LTI/Site association token.

    This token's payload is forged to remove a heavy call to
    `generate_passport_and_signed_lti_parameters` each time
    we want to have an LTI token.
    """

    # for_lti payload
    lti_consumer_site_id = factory.LazyAttribute(lambda o: str(o.consumer_site.id))
    lti_user_id = factory.Faker("uuid4")

    class Meta:  # pylint:disable=missing-class-docstring
        model = LTIUserToken

    class Params:  # pylint:disable=missing-class-docstring
        consumer_site = factory.SubFactory(
            ConsumerSiteFactory,
        )
