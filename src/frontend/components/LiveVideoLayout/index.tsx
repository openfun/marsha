import React, { useState } from 'react';
import { Box, ResponsiveContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

import { LiveVideoResizer } from 'components/LiveVideoResizer';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { DEFAULT_PANEL_WIDTH_RATIO } from 'default/livePanel';
import { theme } from 'utils/theme/theme';

const StyledLiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
`;

interface LiveStudentLayoutProps {
  actionsElement: React.ReactElement;
  displayActionsElement: boolean;
  isPanelOpen?: boolean;
  isXmppReady: boolean;
  liveTitleElement: React.ReactElement;
  mainElement: React.ReactElement;
  sideElement?: React.ReactElement;
}

export const LiveVideoLayout = ({
  actionsElement,
  displayActionsElement,
  isPanelOpen,
  isXmppReady,
  liveTitleElement,
  mainElement,
  sideElement,
}: LiveStudentLayoutProps) => {
  const size = React.useContext(ResponsiveContext);
  const isStarted = useLiveStateStarted((state) => state.isStarted);
  const [savedPanelWidth, setSavedPanelWidthPx] = useState(
    document.documentElement.clientWidth * DEFAULT_PANEL_WIDTH_RATIO,
  );

  if (size === 'small') {
    return (
      <Box style={{ minHeight: '100vh' }}>
        <Box flex="grow">
          <Box flex="grow" hidden={isPanelOpen}>
            <Box flex="grow">
              <Box margin={{ top: 'auto', bottom: 'auto' }} flex="grow">
                {mainElement}
              </Box>
            </Box>

            {isStarted && (
              <Box margin={{ top: '12px' }}>
                <StyledLiveVideoInformationBarWrapper />
                <Box background="white" pad={{ left: 'small' }}>
                  {liveTitleElement}
                </Box>
              </Box>
            )}
          </Box>

          {sideElement && (
            <Box flex="grow" hidden={!isPanelOpen}>
              {sideElement}
            </Box>
          )}
        </Box>

        {displayActionsElement && (
          <Box height={'67px'} margin={{ top: 'small' }}>
            {actionsElement}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box background="bg-marsha">
      <LiveVideoResizer
        isReadyToDisplayRightElement={isXmppReady}
        isPanelOpen={isPanelOpen}
        leftElement={mainElement}
        rightElement={sideElement}
        savedPanelWidthPx={savedPanelWidth}
        setSavedPanelWidthPx={setSavedPanelWidthPx}
      />
      <StyledLiveVideoInformationBarWrapper
        align="center"
        background="white"
        direction="row-responsive"
        height="80px"
        justify="between"
        margin="small"
        pad={{ bottom: 'small', left: 'medium', right: 'medium', top: 'small' }}
        round="6px"
      >
        {liveTitleElement}
        {displayActionsElement && actionsElement}
      </StyledLiveVideoInformationBarWrapper>
    </Box>
  );
};
