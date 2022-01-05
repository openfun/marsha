import { Box, Spinner } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';

import { ChatMessageItem } from 'components/Chat/SharedChatComponents/ChatMessageItem';
import { useMessagesState } from 'data/stores/useMessagesStore';

export const ChatConversationDisplayer = () => {
  const { messages } = useMessagesState();
  const [loading, setLoading] = useState(true);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      scrollableContainerRef.current?.scrollTo({
        top: scrollableContainerRef.current.scrollHeight,
      });
    }, 3000);
  }, []);

  const isScrollInBottom = scrollableContainerRef.current
    ? scrollableContainerRef.current!.scrollHeight -
        Math.round(scrollableContainerRef.current!.scrollTop) ===
      scrollableContainerRef.current!.clientHeight
    : false;

  useEffect(() => {
    if (scrollableContainerRef.current && isScrollInBottom) {
      scrollableContainerRef.current.scrollTo({
        top: scrollableContainerRef.current.scrollHeight,
      });
    }
  }, [messages]);

  return (
    <Box
      overflow={{
        vertical: 'auto',
        horizontal: 'hidden',
      }}
      ref={scrollableContainerRef}
      height="100%"
    >
      {loading ? (
        <Box align="center" height="100%" justify="center" width="100%">
          <Spinner size="large" />
        </Box>
      ) : (
        <React.Fragment>
          {messages.map((msg, idx) => (
            <ChatMessageItem key={idx} msg={msg} />
          ))}
        </React.Fragment>
      )}
    </Box>
  );
};
