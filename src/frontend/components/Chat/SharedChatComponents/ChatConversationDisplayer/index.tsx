import { Box, Spinner } from 'grommet';
import React, { useEffect, useRef, useState } from 'react';

import { ChatMessageGroupItem } from 'components/Chat/SharedChatComponents/ChatMessageGroupItem';
import { ChatPresenceItem } from 'components/Chat/SharedChatComponents/ChatPresenceItem';
import { chatItemType, useChatItemState } from 'data/stores/useChatItemsStore';
import { HISTORY_MESSAGES_TIMEOUT_IN_MS } from 'default/chat';
import { report } from 'utils/errors/report';

export const ChatConversationDisplayer = () => {
  const { chatItems, hasReceivedMessageHistory } = useChatItemState();
  const [loading, setLoading] = useState(true);
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  // When whole message history is received, it adds presences to the chat
  useEffect(() => {
    if (hasReceivedMessageHistory) {
      setLoading(false);
    }
  }, [hasReceivedMessageHistory]);

  // If the message history is not received, an error message should be displayed
  useEffect(() => {
    if (hasReceivedMessageHistory) {
      return;
    }

    const handlerId = setTimeout(() => {
      setLoading(false);
      report('Unable to retrieve message history.');
      // TODO : Prompt an error modal
    }, HISTORY_MESSAGES_TIMEOUT_IN_MS);

    return () => {
      clearTimeout(handlerId);
    };
  }, [hasReceivedMessageHistory]);

  const isScrollInBottom = scrollableContainerRef.current
    ? scrollableContainerRef.current.scrollHeight -
        Math.round(scrollableContainerRef.current.scrollTop) <=
      scrollableContainerRef.current.clientHeight + 10
    : false;

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
      {loading ? (
        <Box align="center" height="100%" justify="center" width="100%">
          <Spinner size="large" />
        </Box>
      ) : (
        <React.Fragment>
          {chatItems.map((chatItem, index) => {
            if (chatItem.type === chatItemType.PRESENCE) {
              return (
                <ChatPresenceItem
                  key={index}
                  presenceItem={chatItem.presenceData}
                />
              );
            } else {
              return (
                <ChatMessageGroupItem
                  key={index}
                  msgGroup={chatItem.messageGroupData}
                />
              );
            }
          })}
        </React.Fragment>
      )}
    </Box>
  );
};
