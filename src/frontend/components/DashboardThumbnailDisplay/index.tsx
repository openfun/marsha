import React from 'react';
import { defineMessages } from 'react-intl';

import { Thumbnail, Video, videoSize } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { videoSizeMapping } from '../../utils/videoSizeMapping';
import { ImageIntlAlt } from '../ImageIntlAlt/ImageIntlAlt';

interface DashboardThumbnailDisplayProps {
  video: Video;
  thumbnail: Nullable<Thumbnail>;
}

const messages = defineMessages({
  thumbnailAlt: {
    defaultMessage: 'Video thumbnail preview image.',
    description: 'Accessibility text for the video thumbnail in the Dashboard.',
    id: 'components.DashboardVideoPane.thumbnailAlt',
  },
});

export const DashboardThumbnailDisplay = ({
  video,
  thumbnail,
}: DashboardThumbnailDisplayProps) => {
  const urls =
    thumbnail && thumbnail.is_ready_to_show
      ? thumbnail.urls
      : video.urls.thumbnails;
  return (
    <ImageIntlAlt
      alt={messages.thumbnailAlt}
      fit={'cover'}
      src={urls[144]}
      srcSet={(Object.keys(urls) as videoSize[]).reduce(
        (acc: string, size: videoSize) => {
          const url = `${urls[size]} ${videoSizeMapping[size]}w`;
          if (acc.length === 0) {
            return url;
          } else {
            return `${acc}, ${url}`;
          }
        },
        '',
      )}
    />
  );
};
