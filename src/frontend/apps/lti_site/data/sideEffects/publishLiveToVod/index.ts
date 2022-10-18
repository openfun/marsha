import { useJwt } from 'lib-components';

import { API_ENDPOINT } from 'settings';
import { Video } from 'lib-components';

export const publishLiveToVod = async (video: Video) => {
  const response = await fetch(
    `${API_ENDPOINT}/videos/${video.id}/live-to-vod/`,
    {
      headers: {
        Authorization: `Bearer ${useJwt.getState().jwt}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to publish a live streaming to VOD for video ${video.id}.`,
    );
  }

  return await response.json();
};
