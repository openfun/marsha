import { API_ENDPOINT } from 'settings';
import { Video, VideoJitsiConnectionInfos } from 'types';

import { useJwt } from 'hooks/stores/useJwt';

export const fetchJitsiInfo = async (
  video: Video,
): Promise<VideoJitsiConnectionInfos> => {
  const response = await fetch(`${API_ENDPOINT}/videos/${video.id}/jitsi/`, {
    headers: {
      Authorization: `Bearer ${useJwt.getState().jwt ?? ''}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(
      `Failed to fetch jitsi info for video ${video.id} with error message ${errorMessage}`,
    );
  }

  return (await response.json()) as VideoJitsiConnectionInfos;
};
