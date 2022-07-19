import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import styled from 'styled-components';

import { DashboardVideoLiveWidgetsContainer } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetsContainer';
import { DashboardVideoLiveWidgetThumbnail } from 'components/DashboardVideoLiveControlPane/widgets/DashboardVideoLiveWidgetThumbnail';
import { TeacherLiveInfoBar } from 'components/TeacherLiveInfoBar';
import VideoPlayer from 'components/VideoPlayer';
import { appData } from 'data/appData';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { useVideo } from 'data/stores/useVideo';
import { initVideoWebsocket } from 'data/websocket';
import { theme } from 'utils/theme/theme';
import { InstructorDashboardVODWidgetGeneralTitle } from './widgets/InstructorDashboardVODWidgetGeneralTitle';
import { InstructorDashboardVODWidgetUploadVideo } from './widgets/InstructorDashboardVODWidgetUploadVideo';

const StyledLiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
`;

export const InstructorDashboardVOD = () => {
  const currentVideo = useVideo((state) => state.getVideo(appData.video!));
  initVideoWebsocket(currentVideo);

  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );

  return (
    <Box background={{ color: 'bg-marsha' }}>
      <VideoPlayer
        video={currentVideo}
        playerType="videojs"
        timedTextTracks={timedTextTracks}
      />
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
        <TeacherLiveInfoBar
          flex={true}
          title={currentVideo.title}
          startDate={currentVideo.starting_at}
        />
      </StyledLiveVideoInformationBarWrapper>
      <InfoWidgetModalProvider value={null}>
        <DashboardVideoLiveWidgetsContainer>
          <InstructorDashboardVODWidgetGeneralTitle video={currentVideo} />
          <InstructorDashboardVODWidgetUploadVideo video={currentVideo} />
          <DashboardVideoLiveWidgetThumbnail isLive={false} />
        </DashboardVideoLiveWidgetsContainer>
      </InfoWidgetModalProvider>
    </Box>
  );
};
