import { useEffect } from 'react';

import { useSharedMediaCurrentPage } from 'data/stores/useSharedMediaCurrentPage';
import { Video } from 'types/tracks';

interface UpdateCurrentSharedLiveMediaPageProps {
  video: Video;
}

export const UpdateCurrentSharedLiveMediaPage = ({
  video,
}: UpdateCurrentSharedLiveMediaPageProps) => {
  const [_, setSharedCurrentPage] = useSharedMediaCurrentPage();

  useEffect(() => {
    if (
      video.active_shared_live_media_page &&
      video.active_shared_live_media &&
      video.active_shared_live_media.urls
    ) {
      const pageNumber = video.active_shared_live_media_page;
      setSharedCurrentPage({
        page: pageNumber,
        imageUrl: video.active_shared_live_media.urls.pages[pageNumber],
      });
    }
  }, [video.active_shared_live_media, video.active_shared_live_media_page]);

  return null;
};
