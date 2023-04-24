"""Tests for the get_recordings service in the ``bbb`` app of the Marsha project."""
from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomFactory, ClassroomRecordingFactory
from marsha.bbb.utils.bbb_utils import get_session_shared_note
from marsha.core.tests.testing_utils import reload_urlconf


@override_settings(
    BBB_SHARED_NOTES_RETRIEVE_LINK="https://10.7.7.1/bigbluebutton/sharednotes"
)
@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomServiceTestCase(TestCase):
    """Test our intentions about the Classroom get_recordings service."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    @responses.activate
    def test_get_shared_notes(self):
        """Validate response when multiple recordings exists."""
        classroom = ClassroomFactory(
            meeting_id="881e8986-9673-11ed-a1eb-0242ac120002", started=True
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "checksum": "7f13332ec54e7df0a02d07904746cb5b8b330498",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <meetingName>random-6256545</meetingName>
                <meetingID>random-6256545</meetingID>
                <internalMeetingID>ab0da0b4a1f283e94cfefdf32dd761eebd5461ce-1635514947533</internalMeetingID>
                <createTime>1635514947533</createTime>
                <createDate>Fri Oct 29 13:42:27 UTC 2021</createDate>
                <voiceBridge>77581</voiceBridge>
                <dialNumber>613-555-1234</dialNumber>
                <attendeePW>trac</attendeePW>
                <moderatorPW>trusti</moderatorPW>
                <running>true</running>
                <duration>0</duration>
                <hasUserJoined>true</hasUserJoined>
                <recording>false</recording>
                <hasBeenForciblyEnded>false</hasBeenForciblyEnded>
                <startTime>1635514947596</startTime>
                <endTime>0</endTime>
                <participantCount>1</participantCount>
                <listenerCount>0</listenerCount>
                <voiceParticipantCount>0</voiceParticipantCount>
                <videoCount>0</videoCount>
                <maxUsers>0</maxUsers>
                <moderatorCount>0</moderatorCount>
                <attendees>
                    <attendee>
                        <userID>w_2xox6leao03w</userID>
                        <fullName>User 1907834</fullName>
                        <role>MODERATOR</role>
                        <isPresenter>true</isPresenter>
                        <isListeningOnly>false</isListeningOnly>
                        <hasJoinedVoice>false</hasJoinedVoice>
                        <hasVideo>false</hasVideo>
                        <clientType>HTML5</clientType>
                    </attendee>
                    <attendee>
                        <userID>w_bau7cr7aefju</userID>
                        <fullName>User 1907834</fullName>
                        <role>VIEWER</role>
                        <isPresenter>false</isPresenter>
                        <isListeningOnly>false</isListeningOnly>
                        <hasJoinedVoice>false</hasJoinedVoice>
                        <hasVideo>false</hasVideo>
                        <clientType>HTML5</clientType>
                    </attendee>
                </attendees>
                <metadata>
                </metadata>
                <isBreakout>false</isBreakout>
            </response>
           """,
            status=200,
        )

        shared_note_object = get_session_shared_note(classroom.meeting_id)
        assert (
            shared_note_object.shared_note_url
            == "https://10.7.7.1/bigbluebutton/sharednotes/ab0da0b4a1f283e94cfefdf32dd761eebd5461ce-1635514947533/notes.html"
        )
