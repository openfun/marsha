"""Utils for BBB tests."""

import responses
import xmltodict


def mock_get_meeting_info(meeting_id=None, attendees=None):
    """Mock the getMeetingInfo BBB API call."""
    attendees_tag = "<attendees></attendees>"
    if attendees:
        attendees_tag = xmltodict.unparse(
            {"attendees": {"attendee": attendees}}, full_document=False
        )

    responses.add(
        responses.GET,
        "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
        match=[
            responses.matchers.query_param_matcher(
                {
                    "meetingID": str(meeting_id),
                },
                strict_match=False,
            )
        ]
        if meeting_id
        else (),
        body=f"""
        <response>
            <returncode>SUCCESS</returncode>
            <meetingName>random-6256545</meetingName>
            <meetingID>{meeting_id}</meetingID>
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
            {attendees_tag}
            <metadata>
            </metadata>
            <isBreakout>false</isBreakout>
        </response>
       """,
        status=200,
    )
