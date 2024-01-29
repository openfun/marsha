"""
Marsha social auth pipeline.

Uses the social_edu_federation default pipeline and replace
the `social_core.pipeline.social_auth.auth_allowed` to add a waffle switch.
This also adds the organization creation step.

Assertion (for development/test) is made to insure the step to replace exists in
the original pipeline.
"""

from social_edu_federation.pipeline import DEFAULT_EDU_FED_AUTH_PIPELINE


_steps_mapping = {
    "social_core.pipeline.social_auth.auth_allowed": (
        "marsha.account.social_pipeline.social_auth.auth_allowed"
    ),
    "social_core.pipeline.social_auth.social_details": (
        "marsha.account.social_pipeline.social_auth.social_details"
    ),
}
assert len(  # nosec
    set(_steps_mapping.keys()) & set(DEFAULT_EDU_FED_AUTH_PIPELINE)
) == len(_steps_mapping)


MARSHA_DEFAULT_AUTH_PIPELINE = tuple(
    _steps_mapping.get(step, step) for step in DEFAULT_EDU_FED_AUTH_PIPELINE
) + (
    "marsha.account.social_pipeline.organization.create_organization_from_saml",
    "marsha.account.social_pipeline.playlist.create_playlist_from_saml",
)
