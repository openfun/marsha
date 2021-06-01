"""Tests for check_live_state command."""
from datetime import datetime
from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from botocore.stub import Stubber
import pytz

from ..defaults import RAW, RUNNING
from ..factories import VideoFactory
from ..management.commands import check_live_state


class CheckLiveStateTest(TestCase):
    """Test check_live_state command."""

    def test_check_live_state_command_no_running_live(self):
        """Command should do nothing when there is no running live."""
        out = StringIO()
        with Stubber(check_live_state.logs_client) as logs_client_stubber, Stubber(
            check_live_state.medialive_client
        ) as medialive_stubber:
            call_command("check_live_state", stdout=out)
            logs_client_stubber.assert_no_pending_responses()
            medialive_stubber.assert_no_pending_responses()

        self.assertEqual("", out.getvalue())
        out.close()

    def test_check_live_state_live_running_not_ended(self):
        """A live is running and stream is on-going, the command should not stop it."""
        VideoFactory(
            id="0b791906-ccb3-4450-97cb-7b66fd9ad419",
            created_on=datetime(2020, 8, 25, 0, 0, 0, tzinfo=pytz.utc),
            live_state=RUNNING,
            live_info={
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "medialive": {
                    "channel": {"arn": "medialive:channel:arn", "id": "123456"}
                },
            },
            live_type=RAW,
        )
        out = StringIO()
        with Stubber(check_live_state.logs_client) as logs_client_stubber, Stubber(
            check_live_state.medialive_client
        ) as medialive_stubber:
            logs_client_stubber.add_response(
                "filter_log_events",
                expected_params={
                    "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
                    "startTime": 1598313600000,
                    "filterPattern": (
                        "{"
                        '($.detail-type = "MediaLive Channel Alert") && '
                        '($.resources[0] = "medialive:channel:arn") &&'
                        '($.detail.alert_type = "RTMP Has No Audio/Video")'
                        "}"
                    ),
                },
                service_response={
                    "events": [
                        {
                            "message": "".join(
                                "2020-08-24T12:19:38.401Z\t445f36d3-4210-4e14-840f-596d671f0db6\t"
                                "INFO\tReceived event: "
                                '{"version":"0","id":"a4c27e5a-28c5-d884-754c-39f2250897a1",'
                                '"detail-type":"MediaLive Channel Alert","source":"aws.medialive"'
                                ',"account":"082219553157","time":"2020-08-25T12:19:37Z",'
                                '"region":"eu-west-1","resources":'
                                '["arn:aws:medialive:eu-west-1:082219553157:channel:3686054"],'
                                '"detail":{"alarm_state":"SET","alarm_id":"4e912d2be849354108def4'
                                '0099483af0ccb47763","alert_type":"RTMP Has No Audio/Video",'
                                '"pipeline":"0","channel_arn":"arn:aws:medialive:eu-west-1:'
                                '082219553157:channel:3686054","message":'
                                '"Waiting for RTMP input"}}\n',
                            )
                        },
                        {
                            "message": "".join(
                                "2020-08-24T12:19:38.401Z\t445f36d3-4210-4e14-840f-596d671f0db6\t"
                                "INFO\tReceived event: "
                                '{"version":"0","id":"a4c27e5a-28c5-d884-754c-39f2250897a1",'
                                '"detail-type":"MediaLive Channel Alert","source":"aws.medialive"'
                                ',"account":"082219553157","time":"2020-08-25T12:19:37Z",'
                                '"region":"eu-west-1","resources":'
                                '["arn:aws:medialive:eu-west-1:082219553157:channel:3686054"],'
                                '"detail":{"alarm_state":"SET","alarm_id":"4e912d2be849354108def4'
                                '0099483af0ccb47763","alert_type":"RTMP Has No Audio/Video",'
                                '"pipeline":"1","channel_arn":"arn:aws:medialive:eu-west-1:'
                                '082219553157:channel:3686054","message":'
                                '"Waiting for RTMP input"}}\n',
                            )
                        },
                        {
                            "message": "".join(
                                "2020-08-24T12:19:38.401Z\t445f36d3-4210-4e14-840f-596d671f0db6\t"
                                "INFO\tReceived event: "
                                '{"version":"0","id":"a4c27e5a-28c5-d884-754c-39f2250897a1",'
                                '"detail-type":"MediaLive Channel Alert","source":"aws.medialive"'
                                ',"account":"082219553157","time":"2020-08-25T12:19:37Z",'
                                '"region":"eu-west-1","resources":'
                                '["arn:aws:medialive:eu-west-1:082219553157:channel:3686054"],'
                                '"detail":{"alarm_state":"CLEARED","alarm_id":"4e912d2be849354108d'
                                'ef40099483af0ccb47763","alert_type":"RTMP Has No Audio/Video",'
                                '"pipeline":"1","channel_arn":"arn:aws:medialive:eu-west-1:'
                                '082219553157:channel:3686054","message":'
                                '"Waiting for RTMP input"}}\n',
                            )
                        },
                    ],
                },
            )
            call_command("check_live_state", stdout=out)
            logs_client_stubber.assert_no_pending_responses()
            medialive_stubber.assert_no_pending_responses()

        self.assertIn(
            "Checking video 0b791906-ccb3-4450-97cb-7b66fd9ad419", out.getvalue()
        )
        self.assertNotIn("Stopping channel with id 123456", out.getvalue())
        self.assertNotIn("Channel stopped", out.getvalue())
        out.close()

    def test_check_live_state_running_ended_not_expired(self):
        """Live is ended and the delay is not expired."""
        VideoFactory(
            id="0b791906-ccb3-4450-97cb-7b66fd9ad419",
            created_on=datetime(2020, 8, 25, 0, 0, 0, tzinfo=pytz.utc),
            live_state=RUNNING,
            live_info={
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "medialive": {
                    "channel": {"arn": "medialive:channel:arn", "id": "123456"}
                },
            },
            live_type=RAW,
        )
        out = StringIO()
        with Stubber(check_live_state.logs_client) as logs_client_stubber, Stubber(
            check_live_state.medialive_client
        ) as medialive_stubber, mock.patch(
            "marsha.core.management.commands.check_live_state.generate_expired_date"
        ) as generate_expired_date_mock:
            logs_client_stubber.add_response(
                "filter_log_events",
                expected_params={
                    "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
                    "startTime": 1598313600000,
                    "filterPattern": (
                        "{"
                        '($.detail-type = "MediaLive Channel Alert") && '
                        '($.resources[0] = "medialive:channel:arn") &&'
                        '($.detail.alert_type = "RTMP Has No Audio/Video")'
                        "}"
                    ),
                },
                service_response={
                    "events": [
                        {
                            "message": "".join(
                                "2020-08-24T12:19:38.401Z\t445f36d3-4210-4e14-840f-596d671f0db6\t"
                                "INFO\tReceived event: "
                                '{"version":"0","id":"a4c27e5a-28c5-d884-754c-39f2250897a1",'
                                '"detail-type":"MediaLive Channel Alert","source":"aws.medialive"'
                                ',"account":"082219553157","time":"2020-08-25T12:19:37Z",'
                                '"region":"eu-west-1","resources":'
                                '["arn:aws:medialive:eu-west-1:082219553157:channel:3686054"],'
                                '"detail":{"alarm_state":"SET","alarm_id":"4e912d2be849354108def4'
                                '0099483af0ccb47763","alert_type":"RTMP Has No Audio/Video",'
                                '"pipeline":"0","channel_arn":"arn:aws:medialive:eu-west-1:'
                                '082219553157:channel:3686054","message":'
                                '"Waiting for RTMP input"}}\n',
                            )
                        },
                        {
                            "message": "".join(
                                "2020-08-24T12:19:38.401Z\t445f36d3-4210-4e14-840f-596d671f0db6\t"
                                "INFO\tReceived event: "
                                '{"version":"0","id":"a4c27e5a-28c5-d884-754c-39f2250897a1",'
                                '"detail-type":"MediaLive Channel Alert","source":"aws.medialive"'
                                ',"account":"082219553157","time":"2020-08-25T12:25:37Z",'
                                '"region":"eu-west-1","resources":'
                                '["arn:aws:medialive:eu-west-1:082219553157:channel:3686054"],'
                                '"detail":{"alarm_state":"SET","alarm_id":"4e912d2be849354108def4'
                                '0099483af0ccb47763","alert_type":"RTMP Has No Audio/Video",'
                                '"pipeline":"1","channel_arn":"arn:aws:medialive:eu-west-1:'
                                '082219553157:channel:3686054","message":'
                                '"Waiting for RTMP input"}}\n',
                            )
                        },
                    ],
                },
            )
            generate_expired_date_mock.return_value = datetime(
                2020, 8, 25, 12, 0, 0, tzinfo=pytz.utc
            )
            call_command("check_live_state", stdout=out)
            logs_client_stubber.assert_no_pending_responses()
            medialive_stubber.assert_no_pending_responses()

        self.assertIn(
            "Checking video 0b791906-ccb3-4450-97cb-7b66fd9ad419", out.getvalue()
        )
        self.assertNotIn("Stopping channel with id 123456", out.getvalue())
        self.assertNotIn("Channel stopped", out.getvalue())
        out.close()

    def test_check_live_state_running_ended_and_expired(self):
        """Live is ended and the delay is expired. The channel must be stopped."""
        VideoFactory(
            id="0b791906-ccb3-4450-97cb-7b66fd9ad419",
            created_on=datetime(2020, 8, 25, 0, 0, 0, tzinfo=pytz.utc),
            live_state=RUNNING,
            live_info={
                "cloudwatch": {"logGroupName": "/aws/lambda/dev-test-marsha-medialive"},
                "medialive": {
                    "channel": {"arn": "medialive:channel:arn", "id": "123456"}
                },
            },
            live_type=RAW,
        )
        out = StringIO()
        with Stubber(check_live_state.logs_client) as logs_client_stubber, mock.patch(
            "marsha.core.management.commands.check_live_state.stop_live_channel"
        ) as mock_stop_live_channel, mock.patch(
            "marsha.core.management.commands.check_live_state.generate_expired_date"
        ) as generate_expired_date_mock:
            logs_client_stubber.add_response(
                "filter_log_events",
                expected_params={
                    "logGroupName": "/aws/lambda/dev-test-marsha-medialive",
                    "startTime": 1598313600000,
                    "filterPattern": (
                        "{"
                        '($.detail-type = "MediaLive Channel Alert") && '
                        '($.resources[0] = "medialive:channel:arn") &&'
                        '($.detail.alert_type = "RTMP Has No Audio/Video")'
                        "}"
                    ),
                },
                service_response={
                    "events": [
                        {
                            "message": "".join(
                                "2020-08-24T12:19:38.401Z\t445f36d3-4210-4e14-840f-596d671f0db6\t"
                                "INFO\tReceived event: "
                                '{"version":"0","id":"a4c27e5a-28c5-d884-754c-39f2250897a1",'
                                '"detail-type":"MediaLive Channel Alert","source":"aws.medialive"'
                                ',"account":"082219553157","time":"2020-08-25T12:19:37Z",'
                                '"region":"eu-west-1","resources":'
                                '["arn:aws:medialive:eu-west-1:082219553157:channel:3686054"],'
                                '"detail":{"alarm_state":"SET","alarm_id":"4e912d2be849354108def4'
                                '0099483af0ccb47763","alert_type":"RTMP Has No Audio/Video",'
                                '"pipeline":"0","channel_arn":"arn:aws:medialive:eu-west-1:'
                                '082219553157:channel:3686054","message":'
                                '"Waiting for RTMP input"}}\n',
                            )
                        },
                        {
                            "message": "".join(
                                "2020-08-24T12:19:38.401Z\t445f36d3-4210-4e14-840f-596d671f0db6\t"
                                "INFO\tReceived event: "
                                '{"version":"0","id":"a4c27e5a-28c5-d884-754c-39f2250897a1",'
                                '"detail-type":"MediaLive Channel Alert","source":"aws.medialive"'
                                ',"account":"082219553157","time":"2020-08-25T12:25:37Z",'
                                '"region":"eu-west-1","resources":'
                                '["arn:aws:medialive:eu-west-1:082219553157:channel:3686054"],'
                                '"detail":{"alarm_state":"SET","alarm_id":"4e912d2be849354108def4'
                                '0099483af0ccb47763","alert_type":"RTMP Has No Audio/Video",'
                                '"pipeline":"1","channel_arn":"arn:aws:medialive:eu-west-1:'
                                '082219553157:channel:3686054","message":'
                                '"Waiting for RTMP input"}}\n',
                            )
                        },
                    ],
                },
            )

            generate_expired_date_mock.return_value = datetime(
                2020, 8, 25, 12, 30, 0, tzinfo=pytz.utc
            )
            call_command("check_live_state", stdout=out)
            logs_client_stubber.assert_no_pending_responses()
            mock_stop_live_channel.assert_called_once()

        self.assertIn(
            "Checking video 0b791906-ccb3-4450-97cb-7b66fd9ad419", out.getvalue()
        )
        self.assertIn("Stopping channel with id 123456", out.getvalue())
        self.assertIn("Channel stopped", out.getvalue())
        out.close()
