import { Nullable } from 'lib-common';

import { Playlist, Resource, uploadState } from '@lib-components/types/tracks';

export interface Classroom extends Resource {
  playlist: Playlist;
  title: Nullable<string>;
  description: Nullable<string>;
  lti_url: string;
  started: boolean;
  ended: boolean;
  url: string;
  welcome_text: string;
  infos?: ClassroomInfos;
  starting_at: Nullable<string>;
  estimated_duration: Nullable<string>;
  invite_token: Nullable<string>;
  instructor_token: Nullable<string>;
  recordings: ClassroomRecording[];
  enable_waiting_room: boolean;
  enable_shared_notes: boolean;
  enable_chat: boolean;
  enable_presentation_supports: boolean;
  enable_recordings: boolean;
}

export type ClassroomLite = Omit<Classroom, 'infos' | 'playlist'>;

export interface ClassroomInfos {
  returncode: string;
  classroomName: string;
  classroomID: string;
  internalClassroomID: string;
  createTime: string;
  createDate: string;
  voiceBridge: string;
  dialNumber: string;
  attendeePW: string;
  moderatorPW: string;
  running: string;
  duration: string;
  hasUserJoined: string;
  recording: string;
  hasBeenForciblyEnded: string;
  startTime: string;
  endTime: string;
  participantCount: string;
  listenerCount: string;
  voiceParticipantCount: string;
  videoCount: string;
  maxUsers: string;
  moderatorCount: string;
  attendees: Nullable<Attendee[]>;
  metadata: string;
  isBreakout: string;
}

export interface Attendee {
  clientType: string;
  fullName: string;
  hasJoinedVoice: string;
  hasVideo: string;
  isListeningOnly: string;
  isPresenter: string;
  role: string;
  userID: string;
}

export enum ClassroomModelName {
  CLASSROOMS = 'classrooms',
  CLASSROOM_DOCUMENTS = 'classroomdocuments',
}

export interface CreateClassroomActionRequest {
  welcome_text: string;
}

export interface CreateClassroomActionResponse {
  createDate: string;
  createTime: string;
  dialNumber: string;
  duration: string;
  hasBeenForciblyEnded: string;
  hasUserJoined: string;
  internalClassroomID: string;
  classroomID: string;
  message: string;
  messageKey: string;
  moderatorPW: string;
  parentClassroomID: string;
  returncode: string;
  voiceBridge: string;
}

export interface JoinClassroomActionRequest {
  fullname: string;
}

export interface JoinClassroomActionResponse {
  auth_token: string;
  guestStatus: string;
  classroom_id: string;
  message: string;
  messageKey: string;
  returncode: string;
  session_token: string;
  url: string;
  user_id: string;
}

export interface EndClassroomActionRequest {
  welcome_text: string;
}

export interface EndClassroomActionResponse {
  message: string;
  messageKey: string;
  returncode: string;
}

export interface ClassroomDocument extends Resource {
  classroom: Classroom;
  filename: string;
  is_default: boolean;
  upload_state: uploadState;
  uploaded_on: string;
  url: string;
}

export interface ClassroomRecording extends Resource {
  classroom: string;
  video_file_url: string;
  started_at: string;
}
