"""Process module to manage association between LTI users and Marsha users."""
from django.db.transaction import atomic

from marsha.core.models import LtiUserAssociation


def clean_lti_user_id(lti_user_id):
    """Clean the LTI user ID on Python side to reduce the database footprint (not use iexact)"""
    return str(lti_user_id).strip().upper()


def get_user_from_lti_user_id_and_consumer_site(lti_user_id, consumer_site):
    """
    Retrieve the Marsha user from an LTI request

    Parameters
    ----------
    lti_user_id : str
        The LMS user ID

    consumer_site: Type[ConsumerSite]
        The concerned consumer site

    Returns
    -------
    Type[marsha.core.models.User] or None, the marsha user if found.
    """
    if not all((lti_user_id, consumer_site)):
        # Can't determine a user without all information
        return None

    try:
        return (
            LtiUserAssociation.objects.select_related("user")
            .get(
                # do not use iexact to reduce DB footprint
                lti_user_id=clean_lti_user_id(lti_user_id),
                consumer_site=consumer_site,
            )
            .user
        )
    except LtiUserAssociation.DoesNotExist:
        return None


def get_user_from_lti(lti):
    """
    Retrieve the Marsha user from an LTI request

    Parameters
    ----------
    lti : Type[LTI]

    Returns
    -------
    Type[marsha.core.models.User] or None, the marsha user if found.
    """
    lti_user_id = getattr(lti, "user_id", None)
    consumer_site = lti.get_consumer_site()

    return get_user_from_lti_user_id_and_consumer_site(lti_user_id, consumer_site)


@atomic()
def create_user_association(lti_consumer_site_id, lti_user_id, user_id):
    """
    Create an association between LTI user and Marsha user

    Parameters
    ----------
    lti_consumer_site_id : str
        The LTI consumer site ID
    lti_user_id: str
        The LTI user ID
    user_id : str
        The Marsha user ID
    """
    if not all((lti_consumer_site_id, lti_user_id, user_id)):
        # Can't create an association without all information
        raise ValueError("Missing information to create an association")

    LtiUserAssociation.objects.create(
        lti_user_id=clean_lti_user_id(lti_user_id),
        consumer_site_id=lti_consumer_site_id,
        user_id=user_id,
    )
