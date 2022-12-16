import { useEffect } from 'react';

import { useCurrentLive } from 'hooks/useCurrentVideo';
import { useSharedMediaCurrentPage } from 'hooks/useSharedMediaCurrentPage';

export const UpdateCurrentSharedLiveMediaPage = () => {
  const live = useCurrentLive();
  const [_, setSharedCurrentPage] = useSharedMediaCurrentPage();

  useEffect(() => {
    if (
      live.active_shared_live_media_page &&
      live.active_shared_live_media &&
      live.active_shared_live_media.urls
    ) {
      const pageNumber = live.active_shared_live_media_page;
      setSharedCurrentPage({
        page: pageNumber,
        imageUrl: live.active_shared_live_media.urls.pages[pageNumber],
      });
    }
  }, [
    live.active_shared_live_media,
    live.active_shared_live_media_page,
    setSharedCurrentPage,
  ]);

  return null;
};
