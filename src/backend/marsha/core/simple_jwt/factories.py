"""Factories for the Marsha JWTs module"""
import types

import factory

from marsha.core.factories import UserFactory
from marsha.core.simple_jwt.tokens import UserAccessToken


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
