import { DateTime } from 'luxon';
import create from 'zustand';

export type ChatMessageType = {
  sentAt: DateTime;
  sender: string;
  content: string;
};

type State = {
  messages: ChatMessageType[];
  addMessage: (msg: ChatMessageType) => void;
};

export const useMessagesState = create<State>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((state) => ({
      messages: state.messages.concat({
        sentAt: msg.sentAt,
        sender: msg.sender,
        content: msg.content,
      }),
    })),
}));
