import { Box } from 'grommet';
import { Button, ChatSVG, ViewersSVG, WebinarSVG } from 'lib-components';
import React, { useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useCurrentVideo } from '@lib-video/hooks';
import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';

const messages = defineMessages({
  webinar: {
    defaultMessage: 'Webinar',
    description: 'Label for the webinar button in the mobile panel',
    id: 'live.common.PanelWebinar.live',
  },
  showWebinar: {
    defaultMessage: 'Show webinar',
    description: 'Title for the webinar button in the mobile panel',
    id: 'live.common.PanelWebinar.showWebinar',
  },
  chat: {
    defaultMessage: 'Chat',
    description: 'Label for the chat button in the mobile panel',
    id: 'live.common.PanelWebinar.Chat',
  },
  showChat: {
    defaultMessage: 'Show chat',
    description: 'Title for the chat button in the mobile panel',
    id: 'live.common.PanelWebinar.showChat',
  },
  viewers: {
    defaultMessage: 'Viewers',
    description: 'Label for the viewer button in the mobile panel',
    id: 'live.common.PanelWebinar.viewers',
  },
  showViewers: {
    defaultMessage: 'Show viewers',
    description: 'Title for the viewer button in the mobile panel',
    id: 'live.common.PanelWebinar.showViewers',
  },
});

interface SlidingBoxProps {
  active1: boolean;
  active2: boolean;
  active3: boolean;
}

const SlidingBox = styled(Box)<SlidingBoxProps>`
  position: absolute;
  top: 5px;
  left: 0;
  transition: all 0.5s ease-out;
  border-top: 2px solid #d7e8f3;
  border-radius: 9px 9px 0 0;
  ${({ active2, active3 }) =>
    (active2 && `transform: translateX(100%);`) ||
    (active3 && `transform: translateX(200%);`)}
`;

const TabBox = styled(Box)`
  flex: 1;
  z-index: 1;
  transition: all 0.5s ease-in-out;
  border-top: 2px solid transparent;
  padding: 0.5rem;
  border-radius: 9px 9px 0 0;
  &:hover {
    background: #ffffff44;
    border-top-color: #d7e8f3;
  }
  & > button > div {
    padding: 0.5rem;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    height: 45px;

    & > div > div {
      right: -5px;
      top: -5px;
      bottom: auto;
    }

    & div:nth-child(2) {
      margin-top: 0;
    }
  }
`;

export const TabPanelWebinar = () => {
  const intl = useIntl();
  const video = useCurrentVideo();
  const { isPanelVisible, setPanelVisibility, availableItems, currentItem } =
    useLivePanelState((state) => ({
      setPanelVisibility: state.setPanelVisibility,
      availableItems: state.availableItems,
      currentItem: state.currentItem,
      isPanelVisible: state.isPanelVisible,
    }));
  const nbrOfOnStageRequests =
    video && video.participants_asking_to_join.length;

  let items = 1;
  if (availableItems.includes(LivePanelItem.CHAT)) {
    items++;
  }
  if (availableItems.includes(LivePanelItem.VIEWERS_LIST)) {
    items++;
  }
  const widthSlider = `${100 / items}%`;

  /**
   * Hide the chat panel on mount to see the player first
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPanelVisibility(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [setPanelVisibility]);

  const isBoxToDisplay =
    availableItems.includes(LivePanelItem.CHAT) ||
    availableItems.includes(LivePanelItem.VIEWERS_LIST);

  if (!isBoxToDisplay) {
    return null;
  }

  return (
    <Box
      direction="row"
      height="auto"
      justify="evenly"
      style={{ position: 'relative' }}
      background="bg-marsha"
      pad={{ top: '5px' }}
    >
      <SlidingBox
        role="tab"
        height="100%"
        width={widthSlider}
        background="#fff"
        active1={!isPanelVisible}
        active2={isPanelVisible && currentItem === LivePanelItem.CHAT}
        active3={isPanelVisible && currentItem === LivePanelItem.VIEWERS_LIST}
      />
      <TabBox height="100%">
        <Button
          label={intl.formatMessage(messages.webinar)}
          Icon={WebinarSVG}
          onClick={() => {
            setPanelVisibility(false);
          }}
          title={intl.formatMessage(messages.showWebinar)}
          disabledHover
        />
      </TabBox>

      {availableItems.includes(LivePanelItem.CHAT) && (
        <TabBox height="100%">
          <Button
            label={intl.formatMessage(messages.chat)}
            Icon={ChatSVG}
            onClick={() => {
              setPanelVisibility(true, LivePanelItem.CHAT);
            }}
            title={intl.formatMessage(messages.showChat)}
            disabledHover
          />
        </TabBox>
      )}

      {availableItems.includes(LivePanelItem.VIEWERS_LIST) && (
        <TabBox height="100%">
          <Button
            badge={
              nbrOfOnStageRequests !== 0
                ? nbrOfOnStageRequests?.toString()
                : undefined
            }
            label={intl.formatMessage(messages.viewers)}
            Icon={ViewersSVG}
            onClick={() => {
              setPanelVisibility(true, LivePanelItem.VIEWERS_LIST);
            }}
            title={intl.formatMessage(messages.showViewers)}
            disabledHover
          />
        </TabBox>
      )}
    </Box>
  );
};
