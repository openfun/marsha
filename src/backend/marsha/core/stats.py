"""Stats module for marsha"""

import logging

from django.conf import settings

import requests
from requests.exceptions import HTTPError, RequestException
from sentry_sdk import capture_exception


logger = logging.getLogger(__name__)


def _default_statement():
    return {"nb_views": 0}


def dummy_backend(_, **kwargs):
    """
    Dummy backend always returning stats with 0
    """
    return _default_statement()


def grafana_xapi_fun_backend(video, **kwargs):
    """
    Backend fetching data in a grafana working with XAPI statements
    sent by marsha itself like Potsie
    """
    if (
        not kwargs.get("api_key")
        or not kwargs.get("api_endpoint")
        or not kwargs.get("api_datasource_id")
        or not kwargs.get("api_datastream")
    ):
        logger.info("missing settings to connect to grafana API")
        return _default_statement()

    endpoint_url = (
        f"{kwargs['api_endpoint']}/datasources/proxy/{kwargs['api_datasource_id']}/"
        f"{kwargs['api_datastream']}/_count"
    )
    data = {
        "query": {
            "query_string": {
                "query": (
                    f'verb.id:"https://w3id.org/xapi/video/verbs/played" AND '
                    f'object.id:"uuid://{video.id}" AND result.extensions.https'
                    f"\\:\\/\\/w3id.org\\/xapi\\/video\\/extensions\\/time:[0 TO 30]"
                )
            }
        }
    }

    try:
        response = requests.get(
            endpoint_url,
            json=data,
            headers={
                "Authorization": f"Bearer {kwargs['api_key']}",
                "Content-Type": "application/json",
            },
            timeout=settings.STAT_BACKEND_TIMEOUT,
        )
        response.raise_for_status()
    except HTTPError as http_err:
        logger.warning("Http error %s", http_err)
        return _default_statement()
    except RequestException as err:
        logger.error("Request to grafana error: %s", err)
        capture_exception(err)
        return _default_statement()

    content = response.json()

    return {"nb_views": content.get("count", 0)}
