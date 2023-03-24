import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import {
  useAppConfig,
  useThumbnail,
  useTimedTextTrack,
  Video,
  ThumbnailDisplayer,
  InfoWidgetModalProvider,
  FoldableItem,
} from 'lib-components';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

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

const StyledLiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
`;

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

  const DashboardContent = () => (
    <React.Fragment>
      <StyledLiveVideoInformationBarWrapper
        align="center"
        background="white"
        direction="row-responsive"
        height="80px"
        justify="between"
        margin="small"
        pad={{
          vertical: 'small',
          horizontal: 'medium',
        }}
        round="xsmall"
      >
        <TeacherVideoInfoBar flex startDate={video.starting_at} />
      </StyledLiveVideoInformationBarWrapper>

      <DashboardControlPane
        isLive={false}
        tabs={
          video.live_state === null ? [PaneTabs.STATS] : [PaneTabs.ATTENDANCE]
        }
      />
    </React.Fragment>
  );

  return (
    <CurrentVideoProvider value={video}>
      <VideoWebSocketInitializer url={socketUrl} videoId={video.id}>
        <Box background={{ color: 'bg-marsha' }}>
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
                <DashboardContent />
              </FoldableItem>
            </InfoWidgetModalProvider>
          ) : (
            <DashboardContent />
          )}
        </Box>
      </VideoWebSocketInitializer>
    </CurrentVideoProvider>
  );
};
