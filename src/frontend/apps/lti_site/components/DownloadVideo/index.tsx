import { Box } from 'grommet';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import React, { Fragment, useEffect, useRef } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import videojs, { VideoJsPlayer } from 'video.js';

import { videoSize, VideoUrls } from 'types/tracks';
import { VideoXAPIStatement } from 'XAPI/VideoXAPIStatement';
import { useJwt } from 'data/stores/useJwt';

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

type downloadableSize = Extract<videoSize, 1080 | 720 | 480>;

export const DownloadVideo = ({ urls }: { urls: VideoUrls }) => {
  const { jwt, getDecodedJwt } = useJwt((state) => ({
    jwt: state.jwt,
    getDecodedJwt: state.getDecodedJwt,
  }));

  if (!jwt) {
    throw new Error('Jwt is required.');
  }

  const resolutions = Object.keys(urls.mp4).map(
    (size) => Number(size) as videoSize,
  );
  const player = useRef<VideoJsPlayer>();

  useEffect(() => {
    player.current = Object.values(videojs.getPlayers())[0];
  }, []);

  const onDownload = (size: videoSize) => {
    if (player.current) {
      const callback = () => {
        const videoXAPIStatement = new VideoXAPIStatement(
          jwt,
          getDecodedJwt().session_id,
        );
        videoXAPIStatement.setDuration(player.current!.duration());
        videoXAPIStatement.downloaded(size);
        window.removeEventListener('blur', callback);
      };
      window.addEventListener('blur', callback);
    }
  };
  const elements: JSX.Element[] = ([1080, 720, 480] as downloadableSize[])
    .filter((size) => resolutions.includes(size))
    .reduce((acc: JSX.Element[], size: downloadableSize) => {
      acc.push(
        <Fragment key={`fragment-${size}`}>
          <a onClick={() => onDownload(size)} href={urls.mp4[size]} download>
            {size}p
          </a>
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
    }, []);

  if (elements.length > 0) {
    return (
      <Box align="center" justify="start" direction="row" pad="small">
        <FormattedMessage {...messages.downloadVideo} />
        &nbsp;
        {elements.slice(0, elements.length - 1)}
      </Box>
    );
  }

  return null;
};
