"""Tests for the stats backends in the ``core`` app of the Marsha project."""
from unittest import mock

from django.test import TestCase

from requests import HTTPError, RequestException
import responses

from marsha.core import stats
from marsha.core.factories import VideoFactory
from marsha.core.stats import dummy_backend, grafana_xapi_fun_backend


class StatsTestCase(TestCase):
    """Test our intentions about the stats backends."""

    def test_stats_dummy_backend(self):
        """A dummy backend always returning stats with 0."""
        unused_resource = object()
        unused_kwargs = {
            "any": "data",
            "another": "data",
            "nested": {"any": "data"},
        }
        expected_stats = {"nb_views": 0}
        self.assertEqual(
            expected_stats, dummy_backend(unused_resource, **unused_kwargs)
        )
        self.assertEqual(expected_stats, dummy_backend(unused_resource))

    @mock.patch("marsha.core.stats.logger")
    def test_stats_grafana_xapi_fun_backend_missing_settings(self, logger_mock):
        """Missing API settings should return stats with 0."""
        expected_stats = {"nb_views": 0}
        video = VideoFactory()

        # No settings
        self.assertEqual(expected_stats, grafana_xapi_fun_backend(video))
        logger_mock.info.assert_called_with(
            "missing settings to connect to grafana API"
        )

        required_settings = {
            "api_key": "any",
            "api_endpoint": "any",
            "api_datasource_id": "any",
            "api_datastream": "any",
        }
        for key in required_settings:
            # One setting empty
            settings = required_settings.copy()
            settings[key] = None
            self.assertEqual(
                expected_stats, grafana_xapi_fun_backend(video, **settings)
            )
            logger_mock.info.assert_called_with(
                "missing settings to connect to grafana API"
            )
            logger_mock.reset_mock()

            # One setting missing
            del settings[key]
            self.assertEqual(
                expected_stats, grafana_xapi_fun_backend(video, **settings)
            )
            logger_mock.info.assert_called_with(
                "missing settings to connect to grafana API"
            )
            logger_mock.reset_mock()

    @responses.activate
    def test_stats_grafana_xapi_fun_backend_success(self):
        """Successful call to the backend should return stats."""
        video = VideoFactory()
        settings = {
            "api_key": "grafana_api_key",
            "api_endpoint": "https://grafana.tld/api",
            "api_datasource_id": "1",
            "api_datastream": "statements-ds-marsha",
        }
        responses.get(
            url=(
                f"{settings.get('api_endpoint')}/datasources/proxy/"
                f"{settings.get('api_datasource_id')}/{settings.get('api_datastream')}/_count"
            ),
            match=[
                responses.matchers.json_params_matcher(
                    {
                        "query": {
                            "query_string": {
                                "query": (
                                    'verb.id:"https://w3id.org/xapi/video/verbs/played" '
                                    f'AND object.id:"uuid://{video.id}" '
                                    "AND result.extensions.https\\:\\/\\/w3id.org"
                                    "\\/xapi\\/video\\/extensions\\/time:[0 TO 30]"
                                )
                            }
                        }
                    }
                ),
                responses.matchers.header_matcher(
                    {
                        "Authorization": f"Bearer {settings.get('api_key')}",
                        "Content-Type": "application/json",
                    }
                ),
            ],
            body='{"count":216,"_shards":{"total":24,"successful":24,"skipped":0,"failed":0}}',
        )
        self.assertEqual({"nb_views": 216}, grafana_xapi_fun_backend(video, **settings))

    @responses.activate
    @mock.patch("marsha.core.stats.logger")
    def test_stats_grafana_xapi_fun_backend_HTTPError(self, logger_mock):
        """HttpError from call to the backend should return stats with 0."""
        video = VideoFactory()
        settings = {
            "api_key": "grafana_api_key",
            "api_endpoint": "https://grafana.tld/api",
            "api_datasource_id": "1",
            "api_datastream": "statements-ds-marsha",
        }

        exception = HTTPError("An error occurred")
        responses.get(
            url=(
                f"{settings.get('api_endpoint')}/datasources/proxy/"
                f"{settings.get('api_datasource_id')}/{settings.get('api_datastream')}/_count"
            ),
            body=exception,
        )

        self.assertEqual({"nb_views": 0}, grafana_xapi_fun_backend(video, **settings))
        logger_mock.warning.assert_called_with("Http error %s", exception)

    @responses.activate
    @mock.patch("marsha.core.stats.logger")
    def test_stats_grafana_xapi_fun_backend_RequestException(self, logger_mock):
        """RequestException from call to the backend should return stats with 0."""
        video = VideoFactory()
        settings = {
            "api_key": "grafana_api_key",
            "api_endpoint": "https://grafana.tld/api",
            "api_datasource_id": "1",
            "api_datastream": "statements-ds-marsha",
        }

        exception = RequestException("An error occurred")
        responses.get(
            url=(
                f"{settings.get('api_endpoint')}/datasources/proxy/"
                f"{settings.get('api_datasource_id')}/{settings.get('api_datastream')}/_count"
            ),
            body=exception,
        )

        with mock.patch.object(stats, "capture_exception") as mock_capture_exception:
            self.assertEqual(
                {"nb_views": 0}, grafana_xapi_fun_backend(video, **settings)
            )
            logger_mock.error.assert_called_with(
                "Request to grafana error: %s", exception
            )
            mock_capture_exception.assert_called_once_with(exception)

    @responses.activate
    def test_stats_grafana_xapi_fun_backend_success_no_count(self):
        """Missing count in the backend response should return stats with 0."""
        video = VideoFactory()
        settings = {
            "api_key": "grafana_api_key",
            "api_endpoint": "https://grafana.tld/api",
            "api_datasource_id": "1",
            "api_datastream": "statements-ds-marsha",
        }
        responses.get(
            url=(
                f"{settings.get('api_endpoint')}/datasources/proxy/"
                f"{settings.get('api_datasource_id')}/{settings.get('api_datastream')}/_count"
            ),
            match=[
                responses.matchers.json_params_matcher(
                    {
                        "query": {
                            "query_string": {
                                "query": (
                                    'verb.id:"https://w3id.org/xapi/video/verbs/played" '
                                    f'AND object.id:"uuid://{video.id}" '
                                    "AND result.extensions.https\\:\\/\\/w3id.org"
                                    "\\/xapi\\/video\\/extensions\\/time:[0 TO 30]"
                                )
                            }
                        }
                    }
                ),
                responses.matchers.header_matcher(
                    {
                        "Authorization": f"Bearer {settings.get('api_key')}",
                        "Content-Type": "application/json",
                    }
                ),
            ],
            body='{"other_data":216}',
        )
        self.assertEqual({"nb_views": 0}, grafana_xapi_fun_backend(video, **settings))
