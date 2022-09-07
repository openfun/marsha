import { Box } from 'grommet';
import React, { useEffect, useRef } from 'react';

import { ChatMessageGroupItem } from 'components/Chat/ChatMessageGroupItem';
import { useChatItemState } from 'data/stores/useChatItemsStore';

export const ChatConversationDisplayer = () => {
  const { chatItems } = useChatItemState();
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  const isScrollInBottom = scrollableContainerRef.current
    ? scrollableContainerRef.current.scrollHeight -
        Math.round(scrollableContainerRef.current.scrollTop) <=
      scrollableContainerRef.current.clientHeight + 10
    : false;

  useEffect(() => {
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollTo({
        top: scrollableContainerRef.current.scrollHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (scrollableContainerRef.current && isScrollInBottom) {
      scrollableContainerRef.current.scrollTo({
        top: scrollableContainerRef.current.scrollHeight,
      });
    }
  });

  return (
    <Box
      fill="vertical"
      overflow={{
        horizontal: 'hidden',
        vertical: 'auto',
      }}
      ref={scrollableContainerRef}
    >
      {chatItems.map((chatItem, index) => {
        return (
          <ChatMessageGroupItem
            key={index}
            msgGroup={chatItem.messageGroupData}
          />
        );
      })}
    </Box>
  );
};
