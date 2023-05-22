import * as faker from 'faker';
import {
  playlistMockFactory,
  uploadState,
  Classroom,
  ClassroomDocument,
  ClassroomInfos,
  ClassroomRecording,
  ClassroomRecordingVod,
} from 'lib-components';

const { READY } = uploadState;

export const classroomMockFactory = <T extends Partial<Classroom>>(
  classroom: T = {} as T,
): Classroom & T => {
  return {
    id: faker.datatype.uuid(),
    playlist: playlistMockFactory(),
    title: faker.name.title(),
    description: faker.lorem.paragraph(),
    lti_url: faker.internet.url(),
    started: faker.datatype.boolean(),
    ended: faker.datatype.boolean(),
    url: faker.internet.url(),
    welcome_text: faker.lorem.text(),
    infos: classroomInfosMockFactory(),
    starting_at: null,
    estimated_duration: null,
    invite_token: null,
    instructor_token: null,
    recordings: [],
    enable_waiting_room: false,
    enable_shared_notes: true,
    enable_chat: true,
    enable_presentation_supports: true,
    enable_recordings: true,
    recording_purpose: faker.lorem.text(),
    ...classroom,
  };
};

export const classroomInfosMockFactory = (
  classroomInfos: Partial<ClassroomInfos> = {},
): ClassroomInfos => {
  return {
    returncode: 'SUCCESS',
    classroomName: faker.lorem.word(),
    classroomID: faker.lorem.word(),
    internalClassroomID: faker.datatype.string(),
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
    attendees: null,
    metadata: faker.datatype.string(),
    isBreakout: 'false',
    ...classroomInfos,
  };
};

export const classroomDocumentMockFactory = (
  classroomDocument: Partial<ClassroomDocument> = {},
): ClassroomDocument => {
  return {
    classroom: classroomMockFactory(),
    filename: faker.system.fileName(),
    id: faker.datatype.uuid(),
    is_default: false,
    upload_state: READY,
    uploaded_on: faker.date.recent().toISOString(),
    url: faker.internet.url(),
    ...classroomDocument,
  };
};

export const classroomRecordingMockFactory = (
  classroomRecording: Partial<ClassroomRecording> = {},
): ClassroomRecording => {
  return {
    classroom: faker.datatype.uuid(),
    id: faker.datatype.uuid(),
    started_at: faker.date.recent().toISOString(),
    video_file_url: faker.internet.url(),
    vod: null,
    ...classroomRecording,
  };
};

export const classroomRecordingVodMockFactory = (
  classroomRecordingVod: Partial<ClassroomRecordingVod> = {},
): ClassroomRecordingVod => {
  return {
    id: faker.datatype.uuid(),
    title: faker.name.title(),
    upload_state: READY,
    ...classroomRecordingVod,
  };
};
