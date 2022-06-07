import { Box } from 'grommet';
import React, { useEffect, useState } from 'react';

import { useSharedMediaCurrentPage } from 'data/stores/useSharedMediaCurrentPage';
import { Video } from 'types/tracks';

import { NextPageButton } from './NexPageButton';
import { PreviousPageButton } from './PreviousPageButton';

interface TeacherPIPControlsProps {
  video: Video;
  maxPage: number;
}

export const TeacherPIPControls = ({
  video,
  maxPage,
}: TeacherPIPControlsProps) => {
  const [isVisible, setVisible] = useState(0);
  const [_, setSharedCurrentPage] = useSharedMediaCurrentPage();

  useEffect(() => {
    if (isVisible === 0) {
      return;
    }

    let timeoutId = window.setTimeout(() => {
      setVisible(0);
    }, 1200);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isVisible]);

  useEffect(() => {
    if (
      video.active_shared_live_media_page &&
      video.active_shared_live_media &&
      video.active_shared_live_media.urls
    ) {
      setSharedCurrentPage({
        page: video.active_shared_live_media_page,
        imageUrl:
          video.active_shared_live_media.urls.pages[
            video.active_shared_live_media_page
          ],
      });
    }
  }, [video]);

  return (
    <Box
      fill
      animation={
        isVisible > 0
          ? { type: 'fadeIn', duration: 350 }
          : { type: 'fadeOut', duration: 350 }
      }
      onMouseMove={() => {
        setVisible((value) => ++value);
      }}
    >
      <Box margin={{ top: 'auto' }} background="#00000019" pad="small">
        <Box direction="row" margin={{ left: 'auto' }}>
          <PreviousPageButton video={video} />
          <NextPageButton video={video} maxPage={maxPage} />
        </Box>
      </Box>
    </Box>
  );
};
