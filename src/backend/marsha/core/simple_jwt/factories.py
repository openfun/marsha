"""Factories for the Marsha JWTs module"""
import types
import uuid

from django.conf import settings

import factory
from faker.utils.text import slugify

from marsha.core.factories import (
    ConsumerSiteFactory,
    LiveSessionFactory,
    PlaylistFactory,
    UserFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, LTI_ROLES, NONE, STUDENT
from marsha.core.simple_jwt.permissions import ResourceAccessPermissions
from marsha.core.simple_jwt.tokens import (
    ChallengeToken,
    LTIUserToken,
    ResourceAccessToken,
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


class ResourcePermissionsFactory(factory.DictFactory):
    """Factory for resource access permissions."""

    can_access_dashboard = False
    can_update = False

    class Meta:  # pylint:disable=missing-class-docstring
        model = ResourceAccessPermissions

    @classmethod
    def _build(cls, model_class, *args, **kwargs):
        """Build permissions from the dataclass to enforce consistency."""
        permissions = super()._build(model_class, *args, **kwargs)
        return permissions.as_dict()


class BaseResourceTokenFactory(BaseTokenFactory):
    """
    Base class for all resource token factories.
    This allows to provide a resource (video, document, ...)
    to forge the JWT, or nothing to use a random UUID.
    """

    # Should we force the resource to be a playlist?
    #
    # @staticmethod
    # def get_playlist_id(o):
    #     """Get the playlist id from the resource."""
    #     # print("woot")
    #     # breakpoint()
    #     resource_id = uuid.uuid4()
    #     if not o.resource:
    #         print("no resource")
    #         pass
    #     elif o.resource.__class__.__name__ == "Playlist":
    #         print("playlist resource")
    #         resource_id = o.resource.id
    #     elif o.resource.playlist:
    #         print("resource has playlist")
    #         resource_id = o.resource.playlist.id
    #     elif o.resource.video.playlist.id:
    #         print("resource has video")
    #         resource_id = o.resource.video.playlist.id
    #
    #     return str(resource_id)
    #
    # resource_id = factory.LazyAttribute(get_playlist_id)

    resource_id = factory.LazyAttribute(
        lambda o: str(o.resource.id if o.resource else uuid.uuid4())
    )

    class Meta:  # pylint:disable=missing-class-docstring
        abstract = True

    class Params:  # pylint:disable=missing-class-docstring
        resource = None


class ResourceAccessTokenFactory(BaseResourceTokenFactory):
    """Simple resource token. Looks like a public resource token."""

    session_id = factory.Faker("uuid4")

    class Meta:  # pylint:disable=missing-class-docstring
        model = ResourceAccessToken.for_resource_id


class LTIResourceAccessTokenFactory(BaseResourceTokenFactory):
    """
    LTI resource forged token.

    This token's payload is forged to remove a heavy call to
    `generate_passport_and_signed_lti_parameters` each time
    we want to have an LTI token.
    """

    # for_resource_id payload
    session_id = factory.Faker("uuid4")
    permissions = factory.SubFactory(ResourcePermissionsFactory)
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
        model = ResourceAccessToken


class StudentLtiTokenFactory(LTIResourceAccessTokenFactory):
    """LTI resource forged token for student."""

    roles = factory.fuzzy.FuzzyChoice(LTI_ROLES.get(STUDENT), getter=lambda x: [x])


class InstructorOrAdminLtiTokenFactory(LTIResourceAccessTokenFactory):
    """
    LTI resource forged token for instructor or administrators.
    See `marsha.core.views.BaseLTIView`.

    Note: the `can_update` permission is set to True
    to mean "the LTI request context ID is the resource playlist LTI ID".
    When this is not the case, the test must explicitly add `permissions__can_update=False`.
    """

    roles = factory.fuzzy.FuzzyChoice([ADMINISTRATOR, INSTRUCTOR], getter=lambda x: [x])
    permissions = factory.SubFactory(
        ResourcePermissionsFactory,
        can_access_dashboard=True,
        can_update=True,
    )


class PlaylistLtiTokenFactory(InstructorOrAdminLtiTokenFactory):
    """
    LTI resource forged token for instructor or administrators with a playlist access.
    See `marsha.core.views.LTISelectView`.
    """

    playlist_id = factory.LazyAttribute(lambda o: str(o.playlist.id))
    permissions = factory.SubFactory(ResourcePermissionsFactory, can_update=True)

    class Params:  # pylint:disable=missing-class-docstring
        playlist = factory.SubFactory(PlaylistFactory)


class LiveSessionResourceAccessTokenFactory(BaseTokenFactory):
    """Generates a resource access token from a live session."""

    live_session = factory.SubFactory(LiveSessionFactory)
    session_id = factory.Faker("uuid4")

    class Meta:  # pylint:disable=missing-class-docstring
        model = ResourceAccessToken.for_live_session


class LiveSessionLtiTokenFactory(LTIResourceAccessTokenFactory):
    """
    Prefer the use of LiveSessionResourceAccessTokenFactory,
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
        model = ResourceAccessToken

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
