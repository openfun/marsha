import { useVideo } from 'lib-components';
import { useEffect } from 'react';

import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import { useSharedMediaCurrentPage } from '@lib-video/hooks/useSharedMediaCurrentPage';

export const UpdateCurrentSharedLiveMediaPage = () => {
  const live = useCurrentLive();
  const [_, setSharedCurrentPage] = useSharedMediaCurrentPage();
  const { isWatchingVideo, id3Video } = useVideo();

  useEffect(() => {
    if (
      !isWatchingVideo &&
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
    if (
      isWatchingVideo &&
      id3Video?.active_shared_live_media?.id &&
      id3Video.active_shared_live_media_page
    ) {
      const pages = live.shared_live_medias.find(
        (media) => media.id === id3Video.active_shared_live_media?.id,
      )?.urls?.pages;
      const pageNumber = id3Video.active_shared_live_media_page;

      if (!pages) {
        return;
      }
      setSharedCurrentPage({
        page: pageNumber,
        imageUrl: pages[pageNumber],
      });
    }
  }, [
    isWatchingVideo,
    id3Video?.active_shared_live_media?.id,
    id3Video?.active_shared_live_media_page,
    live.active_shared_live_media,
    live.active_shared_live_media_page,
    setSharedCurrentPage,
    live.shared_live_medias,
  ]);

  return null;
};
