import { fetchWrapper, useJwt, API_ENDPOINT, Video } from 'lib-components';

export const navigateSharingDoc = async (
  video: Video,
  targetPage: number,
): Promise<Video> => {
  const response = await fetchWrapper(
    `${API_ENDPOINT}/videos/${video.id}/navigate-sharing/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().getJwt() ?? ''}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        target_page: targetPage,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update shared page for video ${video.id}.`);
  }

  return (await response.json()) as Video;
};
