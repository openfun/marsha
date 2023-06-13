import {
  AppConfig,
  AppConfigProvider,
  CurrentResourceContextProvider,
  ResourceContext,
  UploadHandlers,
  UploadManager,
} from 'lib-components';
import {
  DashboardVideoWrapper,
  converseCleanup,
  useSetVideoState,
  useVideo,
} from 'lib-video';
import { useEffect } from 'react';
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
    defaultMessage: "We didn't find the webinar you are looking for.",
    description: 'Text when the webinar id is not found in the backend.',
    id: 'features.Contents.features.Live.Update.404',
  },
  noWebinar: {
    defaultMessage: 'There is no webinar to display.',
    description: 'Text when there is no webinar to display.',
    id: 'features.Contents.features.Live.Update.noWebinar',
  },
});

const LiveUpdate = () => {
  const intl = useIntl();
  const { liveId } = useParams();

  if (!liveId) {
    return (
      <ManageAPIState
        isError={false}
        isLoading={false}
        hasResult={false}
        nothingToDisplay={intl.formatMessage(messages.noWebinar)}
      />
    );
  }

  return <LiveDashboard liveId={liveId} />;
};

const LiveDashboard = ({ liveId }: { liveId: string }) => {
  const intl = useIntl();
  useEffect(() => {
    // When the component is unmounted, we remove all connection
    // to the XMPP chat.
    return () => {
      (async () => {
        await converseCleanup();
      })();
    };
  }, []);
  const {
    isError,
    error,
    isLoading,
    data: currentVideo,
  } = useVideo(liveId, REACT_QUERY_CONF_API);
  useSetVideoState(currentVideo);

  const resourceContext: ResourceContext = {
    resource_id: liveId,
    roles: [],
    permissions: {
      can_access_dashboard: true,
      can_update: true,
    },
    isFromWebsite: true,
  };

  return (
    <ManageAPIState
      isError={isError}
      error={
        error?.status && messages[error.status as keyof typeof messages]
          ? intl.formatMessage(messages[error.status as keyof typeof messages])
          : undefined
      }
      isLoading={isLoading}
      hasResult={!!(currentVideo && liveId)}
      nothingToDisplay={intl.formatMessage(messages.noWebinar)}
    >
      {currentVideo && (
        <AppConfigProvider value={appConfig}>
          <CurrentResourceContextProvider value={resourceContext}>
            <UploadManager>
              <UploadHandlers />
              <DashboardVideoWrapper video={currentVideo} />
            </UploadManager>
          </CurrentResourceContextProvider>
        </AppConfigProvider>
      )}
    </ManageAPIState>
  );
};

export default LiveUpdate;
