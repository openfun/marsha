import { Box, Button, ResponsiveContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Nullable, theme } from 'lib-common';
import {
  OpenClosePanelSVG,
  useResizer,
  StyledNoSelectElement,
} from 'lib-components';
import React, { useRef } from 'react';
import styled from 'styled-components';

import { TabPanelWebinar } from '@lib-video/components/live/common/TabPanelWebinar';
import {
  DEFAULT_PANEL_WIDTH_RATIO,
  MAX_PANEL_WIDTH_RATIO,
  MIN_PANEL_WIDTH_RATIO,
} from '@lib-video/conf/livePanel';
import { useLivePanelState } from '@lib-video/hooks/useLivePanelState';
import { useLiveStateStarted } from '@lib-video/hooks/useLiveStateStarted';
import { SetDisplayNameProvider } from '@lib-video/hooks/useSetDisplayName';

import { DisplayNameForm } from './DisplayNameForm';

const StyledLiveVideoInformationBarWrapper = styled(Box)`
  -webkit-box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  box-shadow: 0px 0px 7px 5px ${normalizeColor('shadow-1', theme)};
  flex-wrap: wrap;
  gap: 1rem;
  height: auto;
  justify-content: space-evenly;
`;

interface LiveStudentLayoutProps {
  isLive: boolean;
  actionsElement: React.ReactElement;
  additionalContent?: React.ReactElement;
  displayActionsElement: boolean;
  isXmppReady: boolean;
  liveTitleElement?: React.ReactElement;
  mainElement: React.ReactElement;
  sideElement?: React.ReactElement;
}

export const VideoLayout = ({
  isLive,
  actionsElement,
  additionalContent,
  displayActionsElement,
  isXmppReady,
  liveTitleElement,
  mainElement,
  sideElement,
}: LiveStudentLayoutProps) => {
  const isLargeLayout = React.useContext(ResponsiveContext) !== 'small';
  const containerRef = useRef<Nullable<HTMLDivElement>>(null);
  const isStarted = useLiveStateStarted((state) => state.isStarted);
  const { isPanelOpen, setPanelVisibility } = useLivePanelState((state) => ({
    isPanelOpen: state.isPanelVisible,
    setPanelVisibility: state.setPanelVisibility,
  }));
  const { width, isResizing, ResizableContainer } = useResizer(
    DEFAULT_PANEL_WIDTH_RATIO,
    containerRef,
    MIN_PANEL_WIDTH_RATIO,
    MAX_PANEL_WIDTH_RATIO,
  );

  return (
    <SetDisplayNameProvider value={false}>
      {!isLargeLayout && <TabPanelWebinar />}
      <DisplayNameForm
        fullPage={!isLargeLayout}
        target={containerRef.current}
      />
      <Box background="bg-marsha">
        <Box ref={containerRef}>
          <Box flex={isLargeLayout ? undefined : 'grow'}>
            <Box direction="row" style={{ position: 'relative' }}>
              <Box flex style={{ position: 'relative' }}>
                <Box flex="grow">
                  <StyledNoSelectElement
                    margin={{ top: 'auto', bottom: 'auto' }}
                    flex="grow"
                    isSelectDisable={isResizing}
                  >
                    {mainElement}
                  </StyledNoSelectElement>
                </Box>

                {isLargeLayout && !isPanelOpen && sideElement && (
                  <Button
                    disabled={!isXmppReady}
                    icon={
                      <OpenClosePanelSVG
                        height="20px"
                        iconColor="white"
                        width="20px"
                      />
                    }
                    onClick={() => setPanelVisibility(true)}
                    style={{
                      padding: '0px',
                      position: 'absolute',
                      right: '30px',
                      top: '18px',
                      zIndex: 30,
                    }}
                  />
                )}

                {!isLive && isStarted && (
                  <Box margin={{ top: 'medium' }}>
                    <StyledLiveVideoInformationBarWrapper />
                    <Box background="white" pad={{ left: 'small' }}>
                      {liveTitleElement}
                    </Box>
                  </Box>
                )}
              </Box>

              {isXmppReady && isPanelOpen && sideElement && (
                <ResizableContainer
                  isResizeHandle={isLargeLayout}
                  style={
                    isLargeLayout
                      ? { minWidth: `${width}px`, position: 'relative' }
                      : {
                          position: 'absolute',
                          left: '0px',
                          top: '0px',
                          height: '100%',
                          width: '100%',
                        }
                  }
                >
                  {isLargeLayout && isPanelOpen && (
                    <Button
                      icon={
                        <OpenClosePanelSVG
                          height="20px"
                          iconColor="white"
                          width="20px"
                        />
                      }
                      onClick={() => setPanelVisibility(false)}
                      style={{
                        left: '-10px',
                        padding: '0px',
                        position: 'absolute',
                        top: '18px',
                        transform: 'rotate(180deg)',
                        zIndex: 30,
                      }}
                    />
                  )}
                  <StyledNoSelectElement fill isSelectDisable={isResizing}>
                    {sideElement}
                  </StyledNoSelectElement>
                </ResizableContainer>
              )}
            </Box>
          </Box>

          {isLive && (
            <StyledLiveVideoInformationBarWrapper
              align="center"
              background="white"
              direction="row"
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
          )}
        </Box>

        {additionalContent}
      </Box>
    </SetDisplayNameProvider>
  );
};
