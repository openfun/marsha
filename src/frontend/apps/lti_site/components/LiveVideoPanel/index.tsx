import { Tabs, Box, ResponsiveContext, ThemeType, ThemeContext } from 'grommet';
import { useCurrentResourceContext, ShouldNotHappen } from 'lib-components';
import React, { useEffect, useContext, Fragment } from 'react';
import styled from 'styled-components';

import { Chat } from 'components/Chat';
import { ViewersList } from 'components/ViewersList';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';

import { LiveVideoTabPanel } from './LiveVideoTabPanel';

const ContentContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
`;

const RelativeBox = styled(Box)`
  position: relative;
`;

export const LiveVideoPanel = () => {
  const size = useContext(ResponsiveContext);
  const [context] = useCurrentResourceContext();
  const { currentItem, availableItems, setAvailableItems, setPanelVisibility } =
    useLivePanelState((state) => ({
      currentItem: state.currentItem,
      availableItems: state.availableItems,
      setAvailableItems: state.setAvailableItems,
      setPanelVisibility: state.setPanelVisibility,
    }));
  const isMobileView = useContext(ResponsiveContext) === 'small';

  const extendedTheme: ThemeType = {
    tabs: {
      header: {
        extend: `white-space: nowrap; \
        display: flex; \
        flex-wrap: nowrap;`,
      },
      extend: `display: ${size === 'small' ? 'none' : 'flex'};`,
      gap: 'none',
    },
  };
  const canUpdate = context.permissions.can_update;

  useEffect(() => {
    if (!currentItem && !isMobileView) {
      setAvailableItems(availableItems, availableItems[0]);
    }
  }, []);

  //  close panel if there is nothing to display
  useEffect(() => {
    // if (!currentItem) {
    //   setPanelVisibility(false);
    // }
  }, [currentItem]);

  if (!currentItem) {
    return <Fragment />;
  }

  let header = <Fragment />;
  if (availableItems.length > 1) {
    header = (
      <Tabs
        activeIndex={currentItem ? availableItems.indexOf(currentItem) : 0}
        onActive={(index) => setPanelVisibility(true, availableItems[index])}
      >
        {availableItems.map((item, index) => (
          <LiveVideoTabPanel
            item={item}
            selected={currentItem ? item === currentItem : index === 0}
            key={`tab_${item}`}
          />
        ))}
      </Tabs>
    );
  }

  let content;
  switch (currentItem) {
    case LivePanelItem.CHAT:
      content = <Chat />;
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
