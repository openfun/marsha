import {
  API_ENDPOINT,
  ClassroomModelName,
  ClassroomRecording,
  Video,
  fetchResponseHandler,
  fetchWrapper,
  useJwt,
} from 'lib-components';

export const createVOD = async (
  recording: ClassroomRecording,
  title: string,
) => {
  const jwt = useJwt.getState().getJwt();
  if (!jwt) {
    throw new Error('No JWT found');
  }

  const response = await fetchWrapper(
    `${API_ENDPOINT}/${ClassroomModelName.CLASSROOMS}/${recording.classroom_id}/${ClassroomModelName.CLASSROOM_RECORDINGS}/${recording.id}/create-vod/`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ title }),
    },
  );

  return await fetchResponseHandler<Video>(response);
};
