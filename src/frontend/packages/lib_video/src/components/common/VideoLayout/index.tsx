import { Button } from '@openfun/cunningham-react';
import { Nullable, colorsTokens } from 'lib-common';
import {
  Box,
  OpenClosePanelSVG,
  StyledNoSelectElement,
  useResizer,
  useResponsive,
} from 'lib-components';
import React, { useRef } from 'react';

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
  const { isDesktop: isLargeLayout } = useResponsive();
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
      <Box background={colorsTokens['primary-100']}>
        <Box ref={containerRef}>
          <Box flex={isLargeLayout ? undefined : 'grow'}>
            <Box direction="row" style={{ position: 'relative' }}>
              <Box flex style={{ position: 'relative' }}>
                <Box flex="grow">
                  <StyledNoSelectElement
                    margin={{ top: 'auto', bottom: 'auto' }}
                    $isSelectDisable={isResizing}
                  >
                    {mainElement}
                  </StyledNoSelectElement>
                </Box>

                {isXmppReady &&
                  isLargeLayout &&
                  !isPanelOpen &&
                  sideElement && (
                    <Button
                      color="tertiary"
                      className="c__button-no-bg"
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
                        zIndex: 19,
                      }}
                    />
                  )}

                {!isLive && isStarted && (
                  <Box
                    align="center"
                    direction="row"
                    background="white"
                    margin="small"
                    pad={{
                      vertical: 'small',
                      horizontal: 'medium',
                    }}
                    round="xsmall"
                    elevation
                    height="auto"
                  >
                    {liveTitleElement}
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
                      color="tertiary"
                      className="c__button-no-bg"
                      icon={
                        <OpenClosePanelSVG
                          height="20px"
                          iconColor="white"
                          width="20px"
                        />
                      }
                      onClick={() => setPanelVisibility(false)}
                      style={{
                        left: '-26px',
                        padding: '0px',
                        position: 'absolute',
                        top: '9px',
                        transform: 'rotate(180deg)',
                        zIndex: 19,
                      }}
                    />
                  )}
                  <StyledNoSelectElement fill $isSelectDisable={isResizing}>
                    {sideElement}
                  </StyledNoSelectElement>
                </ResizableContainer>
              )}
            </Box>
          </Box>

          {isLive && (
            <Box
              align="center"
              background="white"
              direction="row"
              justify="space-evenly"
              margin="small"
              pad={{
                vertical: 'small',
                horizontal: 'medium',
              }}
              round="xsmall"
              elevation
              gap="small"
              height="auto"
              style={{ flexWrap: 'wrap' }}
            >
              {liveTitleElement}
              {displayActionsElement && actionsElement}
            </Box>
          )}
        </Box>

        {additionalContent}
      </Box>
    </SetDisplayNameProvider>
  );
};
