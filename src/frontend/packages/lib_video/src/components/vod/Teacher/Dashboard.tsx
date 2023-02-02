import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import {
  useAppConfig,
  useThumbnail,
  useTimedTextTrack,
  Video,
  ThumbnailDisplayer,
} from 'lib-components';
import React from 'react';
import styled from 'styled-components';

import {
  DashboardControlPane,
  PaneTabs,
} from 'components/common/DashboardControlPane';
import { TeacherVideoInfoBar } from 'components/common/TeacherVideoInfoBar';
import { VideoPlayer } from 'components/common/VideoPlayer';
import { VideoWebSocketInitializer } from 'components/common/VideoWebSocketInitializer';
import { CurrentVideoProvider } from 'hooks/useCurrentVideo';

const StyledLiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
`;

interface DashboardProps {
  video: Video;
  socketUrl: string;
}

export const Dashboard = ({ video, socketUrl }: DashboardProps) => {
  const appData = useAppConfig();

  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );
  const thumbnail = useThumbnail((state) => state.getThumbnail());

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
              video.live_state === null
                ? [PaneTabs.STATS]
                : [PaneTabs.ATTENDANCE]
            }
          />
        </Box>
      </VideoWebSocketInitializer>
    </CurrentVideoProvider>
  );
};
