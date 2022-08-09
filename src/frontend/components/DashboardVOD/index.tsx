import { Box } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React from 'react';
import styled from 'styled-components';

import { WidgetsContainer } from 'components/common/dashboard/widgets/WidgetsContainer';
import { WidgetThumbnail } from 'components/common/dashboard/widgets/WidgetThumbnail';
import { ThumbnailDisplayer } from 'components/common/dashboard/widgets/WidgetThumbnail/ThumbnailDisplayer';
import { TeacherLiveInfoBar } from 'components/TeacherLiveInfoBar';
import VideoPlayer from 'components/VideoPlayer';
import { useAppConfig } from 'data/stores/useAppConfig';
import { useCurrentVideo } from 'data/stores/useCurrentRessource/useCurrentVideo';
import { DeleteTimedTextTrackUploadModalProvider } from 'data/stores/useDeleteTimedTextTrackUploadModal';
import { InfoWidgetModalProvider } from 'data/stores/useInfoWidgetModal';
import { useThumbnail } from 'data/stores/useThumbnail';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { theme } from 'utils/theme/theme';
import { TimedTrackModalWrapper } from './components/TimedTrackModalWrapper';
import { DownloadVideo } from './widgets/DownloadVideo';
import { GeneralTitle } from './widgets/GeneralTitle';
import { UploadClosedCaptions } from './widgets/UploadClosedCaptions';
import { UploadSubtitles } from './widgets/UploadSubtitles';
import { UploadTranscripts } from './widgets/UploadTranscripts';
import { UploadVideo } from './widgets/UploadVideo';

const StyledLiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
`;

export const DashboardVOD = () => {
  const video = useCurrentVideo();
  const appData = useAppConfig();

  const timedTextTracks = useTimedTextTrack((state) =>
    state.getTimedTextTracks(),
  );
  const thumbnail = useThumbnail((state) => state.getThumbnail());

  return (
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
        <TeacherLiveInfoBar
          flex={true}
          title={video.title}
          startDate={video.starting_at}
        />
      </StyledLiveVideoInformationBarWrapper>

      <InfoWidgetModalProvider value={null}>
        <DeleteTimedTextTrackUploadModalProvider value={null}>
          <TimedTrackModalWrapper />
          <WidgetsContainer>
            <GeneralTitle />
            <UploadVideo />
            <WidgetThumbnail isLive={false} />
            <DownloadVideo />
            <UploadSubtitles />
            <UploadTranscripts />
            <UploadClosedCaptions />
          </WidgetsContainer>
        </DeleteTimedTextTrackUploadModalProvider>
      </InfoWidgetModalProvider>
    </Box>
  );
};
