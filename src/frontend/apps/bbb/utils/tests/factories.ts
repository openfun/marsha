import * as faker from 'faker';

import { playlistMockFactory } from 'utils/tests/factories';
import { Meeting, MeetingInfos } from 'apps/bbb/types/models';

export const meetingMockFactory = (meeting: Partial<Meeting> = {}): Meeting => {
  return {
    id: faker.datatype.uuid(),
    playlist: playlistMockFactory(),
    title: faker.name.title(),
    lti_url: faker.internet.url(),
    started: faker.datatype.boolean(),
    url: faker.internet.url(),
    welcome_text: faker.lorem.text(),
    infos: meetingInfosMockFactory(),
    ...meeting,
  };
};

export const meetingInfosMockFactory = (
  meetingInfos: Partial<MeetingInfos> = {},
): MeetingInfos => {
  return {
    returncode: 'SUCCESS',
    meetingName: faker.lorem.word(),
    meetingID: faker.lorem.word(),
    internalMeetingID: faker.datatype.string(),
    createTime: faker.date.recent().toString(),
    createDate: faker.date.recent().toString(),
    voiceBridge: faker.datatype.number(5).toString(),
    dialNumber: faker.phone.phoneNumber(),
    attendeePW: faker.lorem.word(),
    moderatorPW: faker.lorem.word(),
    running: 'true',
    duration: faker.datatype.number().toString(),
    hasUserJoined: 'true',
    recording: 'false',
    hasBeenForciblyEnded: 'false',
    startTime: faker.date.recent().toTimeString(),
    endTime: '0',
    participantCount: faker.datatype.number().toString(),
    listenerCount: faker.datatype.number().toString(),
    voiceParticipantCount: faker.datatype.number().toString(),
    videoCount: faker.datatype.number().toString(),
    maxUsers: faker.datatype.number().toString(),
    moderatorCount: faker.datatype.number().toString(),
    attendees: faker.datatype.string(),
    metadata: faker.datatype.string(),
    isBreakout: 'false',
    ...meetingInfos,
  };
};
