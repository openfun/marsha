import { DateTime } from 'luxon';
import create from 'zustand';

import { TIME_TRIGGER_FOR_GROUPING_MESSAGES_IN_MS } from 'default/chat';

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

export enum presenceType {
  ARRIVAL = 'arrival',
  DEPARTURE = 'departure',
}
export type ChatPresenceType = {
  receivedAt: DateTime;
  sender: string;
  type: presenceType;
};

export enum chatItemType {
  GROUP_MESSAGE = 'chat_message',
  PRESENCE = 'presence',
}

export interface ChatMessageGroupWrapper {
  type: chatItemType.GROUP_MESSAGE;
  messageGroupData: ChatMessageGroupType;
}

export interface ChatPresenceItemWrapper {
  type: chatItemType.PRESENCE;
  presenceData: ChatPresenceType;
}

export type ChatItem = ChatMessageGroupWrapper | ChatPresenceItemWrapper;

type State = {
  hasReceivedMessageHistory: boolean;
  setHasReceivedMessageHistory: (hasReceivedMessageHistory: boolean) => void;
  chatItems: ChatItem[];
  addMessage: (newMessage: ReceivedMessageType) => void;
  addPresence: (newPresence: ChatPresenceType) => void;
  displayName: string | null;
  setDisplayName: (displayName: string) => void;
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
  addPresence: (presence) =>
    set((state) => ({
      chatItems: state.chatItems.concat({
        type: chatItemType.PRESENCE,
        presenceData: presence,
      }),
    })),
  displayName: null,
  setDisplayName: (displayName) => set({ displayName }),
}));
