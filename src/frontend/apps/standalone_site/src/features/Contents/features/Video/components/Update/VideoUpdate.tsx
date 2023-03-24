import {
  AppConfig,
  AppConfigProvider,
  UploadHandlers,
  UploadManager,
} from 'lib-components';
import { useVideo, DashboardVideoWrapper, useSetVideoState } from 'lib-video';
import { defineMessages, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import liveBackground from 'assets/img/liveBackground.jpg';
import { REACT_QUERY_CONF_API } from 'conf/global';
import { ManageAPIState } from 'features/Contents';

const appConfig = {
  static: {
    img: {
      liveBackground,
    },
  },
} as AppConfig;

const messages = defineMessages({
  404: {
    defaultMessage: "We don't find the video you are looking for.",
    description: 'Text when the video id is not found in the backend.',
    id: 'features.Contents.features.Video.Dashboard.404',
  },
  NoVideo: {
    defaultMessage: 'There is no video to display.',
    description: 'Text when there is no video to display.',
    id: 'features.Contents.features.Video.Dashboard.NoVideo',
  },
});

const VideoUpdate = () => {
  const intl = useIntl();
  const { videoId } = useParams<{ videoId?: string }>();

  if (!videoId) {
    return (
      <ManageAPIState
        isError={false}
        isLoading={false}
        hasResult={false}
        nothingToDisplay={intl.formatMessage(messages.NoVideo)}
      />
    );
  }

  return <VideoDashboard videoId={videoId} />;
};

const VideoDashboard = ({ videoId }: { videoId: string }) => {
  const intl = useIntl();
  const {
    isError,
    error,
    isLoading,
    data: currentVideo,
  } = useVideo(videoId, REACT_QUERY_CONF_API);

  useSetVideoState(currentVideo);

  return (
    <ManageAPIState
      isError={isError}
      error={
        error?.status && messages[error.status as keyof typeof messages]
          ? intl.formatMessage(messages[error.status as keyof typeof messages])
          : undefined
      }
      isLoading={isLoading}
      hasResult={!!(currentVideo && videoId)}
      nothingToDisplay={intl.formatMessage(messages.NoVideo)}
    >
      {currentVideo && (
        <AppConfigProvider value={appConfig}>
          <UploadManager>
            <UploadHandlers />
            <DashboardVideoWrapper video={currentVideo} />
          </UploadManager>
        </AppConfigProvider>
      )}
    </ManageAPIState>
  );
};

export default VideoUpdate;
