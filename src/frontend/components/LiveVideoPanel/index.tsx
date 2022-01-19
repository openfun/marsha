import React, { useEffect, useContext } from 'react';
import { Tabs, Box, Grommet, ResponsiveContext } from 'grommet';
import styled from 'styled-components';

import { Chat } from 'components/Chat';
import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { Video } from 'types/tracks';
import { ShouldNotHappen } from 'utils/errors/exception';
import { theme } from 'utils/theme/theme';

import { LiveVideoTabPanel } from './LiveVideoTabPanel';

const StyledGrommet = styled(Grommet)`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

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

interface LiveVideoPanelProps {
  video: Video;
}

export const LiveVideoPanel = ({ video }: LiveVideoPanelProps) => {
  const size = useContext(ResponsiveContext);
  const { currentItem, availableItems, setPanelVisibility } = useLivePanelState(
    (state) => ({
      currentItem: state.currentItem,
      availableItems: state.availableItems,
      setPanelVisibility: state.setPanelVisibility,
    }),
  );

  //  close panel if there is nothing to display
  useEffect(() => {
    if (!currentItem) {
      setPanelVisibility(false);
    }
  }, [currentItem]);

  if (!currentItem) {
    return <React.Fragment />;
  }

  let header;
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
      content = <Chat video={video} />;
      break;
    case LivePanelItem.APPLICATION:
      //  TODO : implement this item
      content = <p>application content</p>;
      break;
    case LivePanelItem.JOIN_DISCUSSION:
      //  TODO : implement this item
      content = <p>join discussion content</p>;
      break;
    default:
      throw new ShouldNotHappen(currentItem);
  }

  return (
    <StyledGrommet
      theme={{
        ...theme,
        tabs: {
          header: {
            extend: `white-space: nowrap; \
            display: flex; \
            flex-wrap: nowrap;`,
          },
          extend: `display: ${size === 'small' ? 'none' : 'flex'};`,
          gap: 'none',
        },
      }}
    >
      {header}
      <RelativeBox flex="grow">
        <ContentContainer>{content}</ContentContainer>
      </RelativeBox>
    </StyledGrommet>
  );
};
