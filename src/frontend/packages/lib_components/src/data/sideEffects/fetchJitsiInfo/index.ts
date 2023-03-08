import { API_ENDPOINT } from 'settings';
import { Video, VideoJitsiConnectionInfos } from 'types';

import { fetchWrapper } from 'common/queries/fetchWrapper';
import { useJwt } from 'hooks/stores/useJwt';

export const fetchJitsiInfo = async (
  video: Video,
): Promise<VideoJitsiConnectionInfos> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video.id}/jitsi/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(
      `Failed to fetch jitsi info for video ${video.id} with error message ${errorMessage}`,
    );
  }

  return (await response.json()) as VideoJitsiConnectionInfos;
};
