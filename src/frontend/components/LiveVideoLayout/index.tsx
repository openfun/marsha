import React, { useRef, useState } from 'react';
import { Box, ResponsiveContext, Stack } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import styled from 'styled-components';

import { LiveVideoResizer } from 'components/LiveVideoResizer';
import { useLiveStateStarted } from 'data/stores/useLiveStateStarted';
import { SetDisplayNameProvider } from 'data/stores/useSetDisplayName';
import { DEFAULT_PANEL_WIDTH_RATIO } from 'default/livePanel';
import { theme } from 'utils/theme/theme';
import { DisplayNameForm } from './DisplayNameForm';

const StyledLiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
`;

interface LiveStudentLayoutProps {
  actionsElement: React.ReactElement;
  additionalContent?: React.ReactElement;
  displayActionsElement: boolean;
  isPanelOpen?: boolean;
  isXmppReady: boolean;
  liveTitleElement: React.ReactElement;
  mainElement: React.ReactElement;
  sideElement?: React.ReactElement;
}

export const LiveVideoLayout = ({
  actionsElement,
  additionalContent,
  displayActionsElement,
  isPanelOpen,
  isXmppReady,
  liveTitleElement,
  mainElement,
  sideElement,
}: LiveStudentLayoutProps) => {
  const size = React.useContext(ResponsiveContext);
  const containerRef = useRef<HTMLDivElement>(null);
  const isStarted = useLiveStateStarted((state) => state.isStarted);
  const [savedPanelWidth, setSavedPanelWidthPx] = useState(
    document.documentElement.clientWidth * DEFAULT_PANEL_WIDTH_RATIO,
  );

  if (size === 'small') {
    return (
      <SetDisplayNameProvider value={false}>
        <DisplayNameForm />
        <Box height={{ min: '100vh' }}>
          <Box height={{ min: '100vh' }}>
            <Box flex="grow">
              <Stack interactiveChild="last">
                <Box flex="grow">
                  <Box flex="grow">
                    <Box margin={{ top: 'auto', bottom: 'auto' }} flex="grow">
                      {mainElement}
                    </Box>
                  </Box>

                  {isStarted && (
                    <Box margin={{ top: 'medium' }}>
                      <StyledLiveVideoInformationBarWrapper />
                      <Box background="white" pad={{ left: 'small' }}>
                        {liveTitleElement}
                      </Box>
                    </Box>
                  )}
                </Box>

                {sideElement && isPanelOpen && (
                  <Box height="100%">{sideElement}</Box>
                )}
              </Stack>
            </Box>

            {displayActionsElement && (
              <Box height={'67px'} margin={{ top: 'small' }}>
                {actionsElement}
              </Box>
            )}
          </Box>

          {additionalContent}
        </Box>
      </SetDisplayNameProvider>
    );
  }

  return (
    <SetDisplayNameProvider value={false}>
      <DisplayNameForm target={containerRef.current} />
      <Box ref={containerRef} background="bg-marsha">
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
          pad={{
            bottom: 'small',
            left: 'medium',
            right: 'medium',
            top: 'small',
          }}
          round="xsmall"
        >
          {liveTitleElement}
          {displayActionsElement && actionsElement}
        </StyledLiveVideoInformationBarWrapper>
      </Box>
      {additionalContent}
    </SetDisplayNameProvider>
  );
};
