import { Tabs, Box, ThemeType, ThemeContext } from 'grommet';
import {
  useCurrentResourceContext,
  ShouldNotHappen,
  useResponsive,
} from 'lib-components';
import React, { useEffect, Fragment } from 'react';
import styled from 'styled-components';

import { Chat } from '@lib-video/components/live/common/Chat';
import { ViewersList } from '@lib-video/components/live/common/ViewersList';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

import { LiveVideoTabPanel } from './LiveVideoTabPanel';

export const ContentContainer = styled.div`
  position: absolute;
  inset: 0px;
  padding-top: 1rem;
`;

const RelativeBox = styled(Box)`
  position: relative;
`;

export interface LiveVideoPanelProps {
  isLive: boolean;
}

export const LiveVideoPanel = ({ isLive }: LiveVideoPanelProps) => {
  const { isMobile } = useResponsive();
  const [context] = useCurrentResourceContext();
  const { currentItem, availableItems, setPanelVisibility } = useLivePanelState(
    (state) => ({
      currentItem: state.currentItem,
      availableItems: state.availableItems,
      setPanelVisibility: state.setPanelVisibility,
    }),
  );

  const extendedTheme: ThemeType = {
    tabs: {
      header: {
        extend: `white-space: nowrap; \
        display: flex; \
        flex-wrap: nowrap;`,
      },
      extend: `display: ${isMobile ? 'none' : 'flex'};`,
      gap: 'none',
    },
  };
  const canUpdate = context.permissions.can_update;

  //  close panel if there is nothing to display
  useEffect(() => {
    if (!currentItem) {
      setPanelVisibility(false);
    }
  }, [currentItem, setPanelVisibility]);

  if (!currentItem) {
    return <React.Fragment />;
  }

  let header = <Fragment />;
  if (availableItems.length > 1) {
    header = (
      <Tabs
        activeIndex={availableItems.indexOf(currentItem)}
        onActive={(index) => setPanelVisibility(true, availableItems[index])}
      >
        {availableItems.map((item) => (
          <LiveVideoTabPanel
            item={item}
            selected={item === currentItem}
            key={`tab_${item}`}
          />
        ))}
      </Tabs>
    );
  }

  let content;
  switch (currentItem) {
    case LivePanelItem.CHAT:
      content = <Chat isModerated={!isLive} />;
      break;
    case LivePanelItem.APPLICATION:
      //  TODO : implement this item
      content = <p>application content</p>;
      break;
    case LivePanelItem.VIEWERS_LIST:
      content = <ViewersList isInstructor={canUpdate} />;
      break;
    default:
      throw new ShouldNotHappen(currentItem);
  }

  return (
    <Box background="white" flex direction="column">
      <ThemeContext.Extend value={extendedTheme}>{header}</ThemeContext.Extend>
      <RelativeBox flex="grow">
        <ContentContainer>{content}</ContentContainer>
      </RelativeBox>
    </Box>
  );
};
