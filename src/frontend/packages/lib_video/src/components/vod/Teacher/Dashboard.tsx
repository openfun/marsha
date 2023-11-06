import { colorsTokens } from 'lib-common';
import {
  Box,
  FoldableItem,
  InfoWidgetModalProvider,
  ThumbnailDisplayer,
  Video,
  useAppConfig,
  useThumbnail,
  useTimedTextTrack,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import {
  DashboardControlPane,
  PaneTabs,
} from '@lib-video/components/common/DashboardControlPane';
import { TeacherVideoInfoBar } from '@lib-video/components/common/TeacherVideoInfoBar';
import { VideoPlayer } from '@lib-video/components/common/VideoPlayer';
import { VideoWebSocketInitializer } from '@lib-video/components/common/VideoWebSocketInitializer';
import { CurrentVideoProvider } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  titleDetails: {
    defaultMessage: '{videoTitle} dashboard',
    description: 'Title of the accordion panel used to display video dashboard',
    id: 'components.Dashboard.titleDetails',
  },
});

interface DashboardContentProps {
  video: Video;
}

const DashboardContent = ({ video }: DashboardContentProps) => (
  <React.Fragment>
    <Box
      align="center"
      background="white"
      direction="row"
      justify="space-between"
      margin="small"
      pad={{
        vertical: 'small',
        horizontal: 'medium',
      }}
      round="xsmall"
      elevation
    >
      <TeacherVideoInfoBar startDate={'10/12/2013'} />
    </Box>

    <DashboardControlPane
      isLive={false}
      tabs={
        video.live_state === null ? [PaneTabs.STATS] : [PaneTabs.ATTENDANCE]
      }
    />
  </React.Fragment>
);

interface DashboardProps {
  video: Video;
  socketUrl: string;
}

export const Dashboard = ({ video, socketUrl }: DashboardProps) => {
  const intl = useIntl();
  const appData = useAppConfig();

  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );
  const thumbnail = useThumbnail((state) => state.getThumbnail());

  return (
    <CurrentVideoProvider value={video}>
      <VideoWebSocketInitializer url={socketUrl} videoId={video.id}>
        <Box background={colorsTokens['primary-100']}>
          {video.is_ready_to_show ? (
            <VideoPlayer
              video={video}
              playerType="videojs"
              timedTextTracks={timedTextTracks}
            />
          ) : (
            <Box>
              <ThumbnailDisplayer
                urlsThumbnail={
                  thumbnail && thumbnail.urls
                    ? thumbnail.urls
                    : { 1080: appData.static.img.liveBackground }
                }
              />
            </Box>
          )}

          {appData && appData.dashboardCollapsed ? (
            <InfoWidgetModalProvider value={null}>
              <FoldableItem
                cardStyle={false}
                initialOpenValue={false}
                title={intl.formatMessage(messages.titleDetails, {
                  videoTitle: video.title,
                })}
              >
                <DashboardContent video={video} />
              </FoldableItem>
            </InfoWidgetModalProvider>
          ) : (
            <DashboardContent video={video} />
          )}
        </Box>
      </VideoWebSocketInitializer>
    </CurrentVideoProvider>
  );
};
