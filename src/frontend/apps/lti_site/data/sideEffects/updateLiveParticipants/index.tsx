import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'settings';
import { Participant } from 'types/Participant';
import { Video } from 'types/tracks';

const updateLiveParticipants = async (
  video: Video,
  participant: Participant,
  participantList: 'participants-asking-to-join' | 'participants-in-discussion',
  method: 'POST' | 'DELETE',
  errorMessage: string,
): Promise<Video> => {
  const response = await fetch(
    `${API_ENDPOINT}/videos/${video.id}/${participantList}/`,
    {
      body: JSON.stringify(participant),
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
        'Content-Type': 'application/json',
      },
      method,
    },
  );

  if (!response.ok) {
    throw new Error(`${errorMessage} ${video.id}.`);
  }

  return response.json();
};

export const addParticipantAskingToJoin = async (
  video: Video,
  participant: Participant,
): Promise<Video> => {
  return updateLiveParticipants(
    video,
    participant,
    'participants-asking-to-join',
    'POST',
    'Failed to add a participant asking to join the live video',
  );
};

export const moveParticipantToDiscussion = async (
  video: Video,
  participant: Participant,
): Promise<Video> => {
  return updateLiveParticipants(
    video,
    participant,
    'participants-in-discussion',
    'POST',
    'Failed to accept a participant asking to join the live video',
  );
};

export const removeParticipantAskingToJoin = async (
  video: Video,
  participant: Participant,
): Promise<Video> => {
  return updateLiveParticipants(
    video,
    participant,
    'participants-asking-to-join',
    'DELETE',
    'Failed to remove a participant asking to join the live video',
  );
};

export const removeParticipantFromDiscussion = async (
  video: Video,
  participant: Participant,
): Promise<Video> => {
  return updateLiveParticipants(
    video,
    participant,
    'participants-in-discussion',
    'DELETE',
    'Failed to remove a participant from the discussion of the live video',
  );
};
