import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Image } from '@lib-components/common';
import { urls, videoSize } from '@lib-components/types/tracks';

import { videoSizeMapping } from './videoSizeMapping';

const messages = defineMessages({
  thumbnailAlt: {
    defaultMessage: 'Live video thumbnail',
    description:
      'Accessibility text for the live video thumbnail in the Dashboard.',
    id: 'components.ThumbnailDisplayer.thumbnailAlt',
  },
});

interface ThumbnailDisplayerProps {
  fitted?: boolean;
  rounded?: boolean;
  urlsThumbnail: urls;
}

export const ThumbnailDisplayer = ({
  fitted = false,
  rounded = false,
  urlsThumbnail,
}: ThumbnailDisplayerProps) => {
  const intl = useIntl();
  const resolutions = Object.keys(urlsThumbnail).map(
    (size) => Number(size) as videoSize,
  );
  return (
    <Image
      alt={intl.formatMessage(messages.thumbnailAlt)}
      fit={fitted ? 'cover' : undefined}
      src={urlsThumbnail[resolutions[0]]}
      srcSet={resolutions.reduce((acc: string, size: videoSize) => {
        const url = `${urlsThumbnail[size] ?? ''} ${videoSizeMapping[size]}w`;
        if (acc.length === 0) {
          return url;
        } else {
          return `${acc}, ${url}`;
        }
      }, '')}
      style={rounded ? { borderRadius: '6px' } : undefined}
    />
  );
};
