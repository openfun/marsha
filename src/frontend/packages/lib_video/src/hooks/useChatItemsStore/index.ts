import { DateTime } from 'luxon';
import { create } from 'zustand';

import { TIME_TRIGGER_FOR_GROUPING_MESSAGES_IN_MS } from '@lib-video/conf/chat';

export type ReceivedMessageType = {
  content: string;
  sender: string;
  sentAt: DateTime;
};

export type ChatMessageType = {
  content: string;
  sentAt: DateTime;
};

export type ChatMessageGroupType = {
  messages: ChatMessageType[];
  sender: string;
};

export enum chatItemType {
  GROUP_MESSAGE = 'chat_message',
}

export interface ChatMessageGroupWrapper {
  type: chatItemType.GROUP_MESSAGE;
  messageGroupData: ChatMessageGroupType;
}

export type ChatItem = ChatMessageGroupWrapper;

type State = {
  hasReceivedMessageHistory: boolean;
  setHasReceivedMessageHistory: (hasReceivedMessageHistory: boolean) => void;
  chatItems: ChatItem[];
  addMessage: (newMessage: ReceivedMessageType) => void;
};

export const useChatItemState = create<State>((set) => ({
  hasReceivedMessageHistory: false,
  setHasReceivedMessageHistory: (hasReceivedMessageHistory) =>
    set({ hasReceivedMessageHistory }),
  chatItems: [],
  addMessage: (newReceivedMessage: ReceivedMessageType) =>
    set((state) => {
      // It checks if the last item is a group message
      const lastChatItem = state.chatItems[state.chatItems.length - 1];
      if (lastChatItem && lastChatItem.type === chatItemType.GROUP_MESSAGE) {
        const lastGroupMessage = lastChatItem.messageGroupData;
        const lastMessage =
          lastGroupMessage.messages[lastGroupMessage.messages.length - 1];
        // It checks if the new message has the same sender and a valid datetime to be added to the last group message
        if (
          lastGroupMessage.sender === newReceivedMessage.sender &&
          newReceivedMessage.sentAt.diff(lastMessage.sentAt).milliseconds <=
            TIME_TRIGGER_FOR_GROUPING_MESSAGES_IN_MS
        ) {
          lastGroupMessage.messages.push({
            content: newReceivedMessage.content,
            sentAt: newReceivedMessage.sentAt,
          });
          return {
            chatItems: [...state.chatItems],
          };
        }
      }
      // Otherwise, a new group message is created and the new message is added in it
      return {
        chatItems: state.chatItems.concat({
          type: chatItemType.GROUP_MESSAGE,
          messageGroupData: {
            messages: [
              {
                content: newReceivedMessage.content,
                sentAt: newReceivedMessage.sentAt,
              },
            ],
            sender: newReceivedMessage.sender,
          },
        }),
      };
    }),
}));
