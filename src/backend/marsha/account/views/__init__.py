"""
    Module containing the marsha's account views:
     - the `model_auth` submodule contains views for the simple Django Model authentication.
     - the `social_renater_saml_auth` provides views for the Renater Federation authentication.
"""
# pylint: disable=wildcard-import,unused-wildcard-import
from .model_auth import *  # noqa isort:skip
from .social_edu_federation_saml_auth import *  # noqa isort:skip
