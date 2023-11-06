import { Box } from 'lib-components';
import React, { useEffect, useState } from 'react';

import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';
import { useSharedMediaCurrentPage } from '@lib-video/hooks/useSharedMediaCurrentPage';

import { NextPageButton } from './NextPageButton';
import { PreviousPageButton } from './PreviousPageButton';

interface TeacherPIPControlsProps {
  maxPage: number;
}

export const TeacherPIPControls = ({ maxPage }: TeacherPIPControlsProps) => {
  const video = useCurrentVideo();
  const [isVisible, setIsVisible] = useState(0);
  const [_, setSharedMediaCurrentPage] = useSharedMediaCurrentPage();

  useEffect(() => {
    if (isVisible === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(0);
    }, 1200);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isVisible]);

  useEffect(() => {
    if (
      video.active_shared_live_media_page &&
      video.active_shared_live_media?.urls
    ) {
      setSharedMediaCurrentPage({
        page: video.active_shared_live_media_page,
        imageUrl:
          video.active_shared_live_media.urls.pages[
            video.active_shared_live_media_page
          ],
      });
    }
  }, [
    setSharedMediaCurrentPage,
    video.active_shared_live_media_page,
    video.active_shared_live_media?.urls,
  ]);

  return (
    <Box
      fill
      style={{
        transition: 'opacity 0.35s ease-in-out',
        opacity: isVisible > 0 ? 1 : 0,
      }}
      onMouseMove={() => {
        setIsVisible((value) => ++value);
      }}
    >
      <Box margin={{ top: 'auto' }} background="#00000019" pad="small">
        <Box direction="row" margin={{ left: 'auto' }}>
          <PreviousPageButton />
          <NextPageButton maxPage={maxPage} />
        </Box>
      </Box>
    </Box>
  );
};
