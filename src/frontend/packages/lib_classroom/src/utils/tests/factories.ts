import { faker } from '@faker-js/faker';
import {
  Classroom,
  ClassroomDocument,
  ClassroomInfos,
  ClassroomRecording,
  ClassroomRecordingVod,
  uploadState,
} from 'lib-components';
import { playlistMockFactory } from 'lib-components/tests';

const { READY } = uploadState;

export const classroomMockFactory = <T extends Partial<Classroom>>(
  classroom: T = {} as T,
): Classroom & T => {
  return {
    id: faker.string.uuid(),
    playlist: playlistMockFactory(),
    title: faker.lorem.words(),
    description: faker.lorem.paragraph(),
    lti_url: faker.internet.url(),
    started: faker.datatype.boolean(),
    ended: faker.datatype.boolean(),
    url: faker.internet.url(),
    welcome_text: faker.lorem.text(),
    infos: classroomInfosMockFactory(),
    starting_at: null,
    estimated_duration: null,
    public_token: null,
    instructor_token: null,
    retention_date: null,
    recordings: [],
    enable_waiting_room: false,
    enable_shared_notes: true,
    enable_chat: true,
    enable_presentation_supports: true,
    enable_recordings: true,
    recording_purpose: faker.lorem.text(),
    sessions: [],
    vod_conversion_enabled: true,
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
    internalClassroomID: faker.string.sample(),
    createTime: faker.date.recent().toString(),
    createDate: faker.date.recent().toString(),
    voiceBridge: faker.number.int(5).toString(),
    dialNumber: faker.phone.number(),
    attendeePW: faker.lorem.word(),
    moderatorPW: faker.lorem.word(),
    running: 'true',
    duration: faker.number.int().toString(),
    hasUserJoined: 'true',
    recording: 'false',
    hasBeenForciblyEnded: 'false',
    startTime: faker.date.recent().toTimeString(),
    endTime: '0',
    participantCount: faker.number.int().toString(),
    listenerCount: faker.number.int().toString(),
    voiceParticipantCount: faker.number.int().toString(),
    videoCount: faker.number.int().toString(),
    maxUsers: faker.number.int().toString(),
    moderatorCount: faker.number.int().toString(),
    attendees: null,
    metadata: faker.string.sample(),
    isBreakout: 'false',
    ...classroomInfos,
  };
};

export const classroomDocumentMockFactory = (
  classroomDocument: Partial<ClassroomDocument> = {},
): ClassroomDocument => {
  return {
    classroom_id: faker.string.uuid().toString(),
    filename: faker.system.fileName(),
    id: faker.string.uuid(),
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
    classroom_id: faker.string.uuid(),
    id: faker.string.uuid(),
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
    id: faker.string.uuid(),
    title: faker.lorem.words(),
    upload_state: READY,
    ...classroomRecordingVod,
  };
};
