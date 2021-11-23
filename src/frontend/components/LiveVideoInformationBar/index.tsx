import React from 'react';
import { Box, ResponsiveContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

import { theme } from 'utils/theme/theme';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';

import { LiveTitleInformation } from './LiveTitleInformation';
import { LiveControlButtons } from './LiveControlButtons';

const LiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
`;

interface LiveVideoInformationBarProps {
  video: Video;
}

export const LiveVideoInformationBar = ({
  video: baseVideo,
}: LiveVideoInformationBarProps) => {
  const size = React.useContext(ResponsiveContext);
  const video = useVideo((state) => state.getVideo(baseVideo));

  return (
    <LiveVideoInformationBarWrapper
      pad={
        size !== 'small'
          ? { left: 'medium', right: 'medium', top: 'small', bottom: 'small' }
          : '18px'
      }
      align="center"
      direction="row-responsive"
      justify="between"
      round="6px"
      margin="small"
    >
      <LiveTitleInformation title={video.title} state={video.live_state} />

      <LiveControlButtons />
    </LiveVideoInformationBarWrapper>
  );
};
