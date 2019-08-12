import { Box } from 'grommet';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import React, { Fragment } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { Video, videoSize } from '../../types/tracks';

const messages = defineMessages({
  downloadVideo: {
    defaultMessage: 'Download this video: ',
    description: 'Text to download the video',
    id: 'components.DownloadVideo.downloadVideo',
  },
  480: {
    defaultMessage: '480p: SD (Mobile)',
    description: 'Mobile quality video',
    id: 'components.DownloadVideo.480',
  },
  720: {
    defaultMessage: '720p: HD (standard)',
    description: 'Normal quality video',
    id: 'components.DownloadVideo.720',
  },
  1080: {
    defaultMessage: '1080p: FullHD (high quality)',
    description: 'High quality video',
    id: 'components.DownloadVideo.1080',
  },
});

const StatusInfo = styled.span`
  cursor: pointer;
`;

type downloadableSize = Extract<videoSize, '1080' | '720' | '480'>;

export const DownloadVideo = ({ video }: { video: Video }) => {
  const elements: JSX.Element[] = [];

  return (
    <Box align="center" justify="start" direction="row" pad="small">
      <FormattedMessage {...messages.downloadVideo} />
      &nbsp;
      {(['1080', '720', '480'] as downloadableSize[])
        .reduce((acc: JSX.Element[], size: downloadableSize) => {
          acc.push(
            <Fragment key={`fragment-${size}`}>
              <a href={video.urls.mp4[size]}>{size}p</a>
              &nbsp;
              <Tooltip
                overlay={<FormattedMessage {...messages[size]} />}
                placement="bottom"
              >
                <StatusInfo>&#9432;</StatusInfo>
              </Tooltip>
            </Fragment>,
          );
          acc.push(<span key={`span-${size}`}>&nbsp;/&nbsp;</span>);

          return acc;
        }, elements)
        .slice(0, elements.length - 1)}
    </Box>
  );
};
