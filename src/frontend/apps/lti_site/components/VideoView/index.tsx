import { Box, Heading, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Crumb, Spinner } from 'lib-components';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import {
  NavLink,
  Redirect,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import styled from 'styled-components';

import { useTimedTextTracks, useVideo } from 'data/queries';
import { ErrorMessage } from 'components/ErrorComponents';
import { UploadableObjectStatusBadge } from 'components/UploadableObjectStatusBadge';
import { UploadField } from 'components/UploadField';
import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import VideoPlayer from 'components/VideoPlayer';
import { modelName } from 'types/models';
import { uploadState, Video } from 'lib-components';
import { theme } from 'utils/theme/theme';

const messages = defineMessages({
  defaultTitle: {
    defaultMessage: 'Video',
    description:
      'Default title for the video view when the video has not loaded.',

    id: 'components.VideoView.defaultTitle',
  },
  loadingTimedTextTracks: {
    defaultMessage: 'Loading subtitles & transcripts...',
    description:
      'Accessible message for the spinner while loading the subtitles in the video view.',
    id: 'components.VideoView.loadingTimedTextTracks',
  },
  loadingVideo: {
    defaultMessage: 'Loading video...',
    description:
      'Accessible message for the spinner while loading the video in video view.',
    id: 'components.VideoView.loadingVideo',
  },
  tabSubtitlesTitle: {
    defaultMessage: 'Subtitles & transcripts',
    description: 'Title for the subtitles & timed text tab in the video view.',
    id: 'components.VideoView.tabSubtitlesTitle',
  },
  tabThumbnailTitle: {
    defaultMessage: 'Thumbnail',
    description: 'Title for the thumbnail tab in the video view.',
    id: 'components.VideoView.tabThumbnailTitle',
  },
  tabVideoPendingMessage: {
    defaultMessage: `There is currently no video file for this Video. You can add
one by dropping or picking a file below.`,
    description:
      'Helpful message for the video tab in video view when there is no video file.',
    id: 'components.VideoView.tabVideoPendingMessage',
  },
  tabVideoProcessingMessage: {
    defaultMessage: `The video is currently being processed.
You will be able to see it or replace it here after it is finished.`,
    description:
      'Loading message for the video tab in video view while the video is processing.',
    id: 'components.VideoView.tabVideoProcessingMessage',
  },
  tabVideoTitle: {
    defaultMessage: 'Video',
    description: 'Title for the video tab in the video view.',
    id: 'components.VideoView.tabVideoTitle',
  },
  tabVideoUploadingMessage: {
    defaultMessage: `The video is currently being uploaded.
You will be able to see it or replace it here after it is processed.`,
    description:
      'Loading message for the video tab in video view while the video is uploading.',
    id: 'components.VideoView.tabVideoUploadingMessage',
  },
});

interface VideoTabProps {
  video: Video;
}

const VideoTab = ({ video }: VideoTabProps) => {
  const { uploadManagerState } = useUploadManager();

  // Get timed text tracks only when the video is ready to show
  const { data: timedTextTracks, status: timedTextTracksStatus } =
    useTimedTextTracks(
      { video: video.id },
      { enabled: video.upload_state === uploadState.READY },
    );

  if (
    video.upload_state === uploadState.PROCESSING ||
    (video.upload_state === uploadState.PENDING &&
      [UploadManagerStatus.INIT, UploadManagerStatus.UPLOADING].includes(
        uploadManagerState[video.id]?.status,
      ))
  ) {
    return (
      <Box
        width="large"
        height="medium"
        align="center"
        justify="center"
        pad={{ horizontal: 'large' }}
        gap="xlarge"
      >
        <Spinner size="large" aria-hidden={true} />
        <Text>
          {video.upload_state === uploadState.PROCESSING ? (
            <FormattedMessage {...messages.tabVideoProcessingMessage} />
          ) : (
            <FormattedMessage {...messages.tabVideoUploadingMessage} />
          )}
        </Text>
      </Box>
    );
  }

  if (video.upload_state === uploadState.READY) {
    switch (timedTextTracksStatus) {
      case 'error':
        return <ErrorMessage code="generic" />;

      case 'idle':
      case 'loading':
        return (
          <Spinner size="large">
            <FormattedMessage {...messages.loadingTimedTextTracks} />
          </Spinner>
        );

      case 'success':
        return (
          <Box width="large">
            <VideoPlayer
              playerType="videojs"
              timedTextTracks={timedTextTracks!.results}
              video={video}
            />
          </Box>
        );
    }
  }

  return (
    <Box
      direction="column"
      width="large"
      height="medium"
      justify="center"
      gap="medium"
    >
      <Text>
        <FormattedMessage {...messages.tabVideoPendingMessage} />
      </Text>
      <UploadField objectType={modelName.VIDEOS} objectId={video.id} />
    </Box>
  );
};

const TabLink = styled(NavLink)`
  padding: 12px 18px;
  border-bottom: 4px solid ${normalizeColor('light-6', theme)};
  color: black;
  text-decoration: none;

  &.active {
    border-bottom-color: ${normalizeColor('brand', theme)};
    color: ${normalizeColor('brand', theme)};
  }
`;

interface VideoViewRouteParams {
  videoId: string;
}

export const VideoView: React.FC = () => {
  const { path, url } = useRouteMatch();
  const { videoId } = useParams<VideoViewRouteParams>();

  const { data, status } = useVideo(videoId);

  const title =
    status === 'success' ? (
      <span>{data!.title}</span>
    ) : (
      <FormattedMessage {...messages.defaultTitle} />
    );

  let content: JSX.Element;
  switch (status) {
    case 'idle':
    case 'loading':
      content = (
        <Spinner size="large">
          <FormattedMessage {...messages.loadingVideo} />
        </Spinner>
      );
      break;

    case 'error':
      content = <ErrorMessage code="generic" />;
      break;

    case 'success':
      content = (
        <Box direction="column" gap="medium">
          <Box direction="row">
            <TabLink to={`${url}/video`}>
              <FormattedMessage {...messages.tabVideoTitle} />
            </TabLink>
            <TabLink to={`${url}/subtitles`}>
              <FormattedMessage {...messages.tabSubtitlesTitle} />
            </TabLink>
            <TabLink to={`${url}/thumbnail`}>
              <FormattedMessage {...messages.tabThumbnailTitle} />
            </TabLink>
          </Box>
          <Switch>
            <Route path={`${path}/video`}>
              <VideoTab video={data!} />
            </Route>

            <Route path={path}>
              <Redirect to={`${url}/video`} />
            </Route>
          </Switch>
        </Box>
      );
      break;
  }

  return (
    <React.Fragment>
      <Crumb title={title} />
      <Box pad="large" align="start">
        {status === 'success' ? (
          <Box margin={{ bottom: 'small' }}>
            <UploadableObjectStatusBadge object={data!} />
          </Box>
        ) : null}
        <Heading level={1}>{title}</Heading>
        {content}
      </Box>
    </React.Fragment>
  );
};
