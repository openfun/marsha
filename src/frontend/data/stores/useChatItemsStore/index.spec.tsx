import { DateTime } from 'luxon';
import { chatItemType, useChatItemState } from '.';
import { ChatPresenceType, presenceType, ReceivedMessageType } from './index';

describe('useChatItemState', () => {
  it('executes useChatItemState/setHasReceivedMessageHistory', () => {
    // initial state
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        hasReceivedMessageHistory: false,
      }),
    );
    useChatItemState.getState().setHasReceivedMessageHistory(true);
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        hasReceivedMessageHistory: true,
      }),
    );
  });

  it('executes useChatItemState/addPresence', () => {
    const JohnArrivalPresence: ChatPresenceType = {
      receivedAt: DateTime.fromISO('2020-12-12T12:12:00'),
      sender: 'John Doe',
      type: presenceType.ARRIVAL,
    };
    const JaneArrivalPresence: ChatPresenceType = {
      receivedAt: DateTime.fromISO('2020-12-12T12:12:05'),
      sender: 'Jane Doe',
      type: presenceType.ARRIVAL,
    };
    const JohnDeparturePresence: ChatPresenceType = {
      receivedAt: DateTime.fromISO('2020-12-12T12:12:10'),
      sender: 'John Doe',
      type: presenceType.DEPARTURE,
    };

    // initial state
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [],
      }),
    );

    useChatItemState.getState().addPresence(JohnArrivalPresence);
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [
          {
            type: chatItemType.PRESENCE,
            presenceData: JohnArrivalPresence,
          },
        ],
      }),
    );

    useChatItemState.getState().addPresence(JaneArrivalPresence);
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [
          {
            type: chatItemType.PRESENCE,
            presenceData: JohnArrivalPresence,
          },
          {
            type: chatItemType.PRESENCE,
            presenceData: JaneArrivalPresence,
          },
        ],
      }),
    );

    useChatItemState.getState().addPresence(JohnDeparturePresence);
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [
          {
            type: chatItemType.PRESENCE,
            presenceData: JohnArrivalPresence,
          },
          {
            type: chatItemType.PRESENCE,
            presenceData: JaneArrivalPresence,
          },
          {
            type: chatItemType.PRESENCE,
            presenceData: JohnDeparturePresence,
          },
        ],
      }),
    );
  });

  it('executes useChatItemState/addMessage', () => {
    const johnMessage1: ReceivedMessageType = {
      content: "This is a John Doe's example message 1",
      sender: 'John Doe',
      sentAt: DateTime.fromISO('2020-12-12T12:12:00'),
    };

    const johnMessage2: ReceivedMessageType = {
      content: "This is a John Doe's example message 2",
      sender: 'John Doe',
      sentAt: DateTime.fromISO('2020-12-12T12:12:05'),
    };

    const janeMessage1: ReceivedMessageType = {
      content: "This is a Jane Doe's example message 1",
      sender: 'Jane Doe',
      sentAt: DateTime.fromISO('2020-12-12T12:12:10'),
    };

    const janeMessage2: ReceivedMessageType = {
      content: "This is a Jane Doe's example message 2",
      sender: 'Jane Doe',
      sentAt: DateTime.fromISO('2020-12-12T12:15:10'),
    };

    // initial state
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [],
      }),
    );

    useChatItemState.getState().addMessage(johnMessage1);
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [
          {
            type: chatItemType.GROUP_MESSAGE,
            messageGroupData: {
              sender: 'John Doe',
              messages: [
                {
                  content: johnMessage1.content,
                  sentAt: johnMessage1.sentAt,
                },
              ],
            },
          },
        ],
      }),
    );

    useChatItemState.getState().addMessage(johnMessage2);
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [
          {
            type: chatItemType.GROUP_MESSAGE,
            messageGroupData: {
              sender: 'John Doe',
              messages: [
                {
                  content: johnMessage1.content,
                  sentAt: johnMessage1.sentAt,
                },
                {
                  content: johnMessage2.content,
                  sentAt: johnMessage2.sentAt,
                },
              ],
            },
          },
        ],
      }),
    );

    useChatItemState.getState().addMessage(janeMessage1);
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [
          {
            type: chatItemType.GROUP_MESSAGE,
            messageGroupData: {
              sender: 'John Doe',
              messages: [
                {
                  content: johnMessage1.content,
                  sentAt: johnMessage1.sentAt,
                },
                {
                  content: johnMessage2.content,
                  sentAt: johnMessage2.sentAt,
                },
              ],
            },
          },
          {
            type: chatItemType.GROUP_MESSAGE,
            messageGroupData: {
              sender: 'Jane Doe',
              messages: [
                {
                  content: janeMessage1.content,
                  sentAt: janeMessage1.sentAt,
                },
              ],
            },
          },
        ],
      }),
    );

    useChatItemState.getState().addMessage(janeMessage2);
    expect(useChatItemState.getState()).toEqual(
      expect.objectContaining({
        chatItems: [
          {
            type: chatItemType.GROUP_MESSAGE,
            messageGroupData: {
              sender: 'John Doe',
              messages: [
                {
                  content: johnMessage1.content,
                  sentAt: johnMessage1.sentAt,
                },
                {
                  content: johnMessage2.content,
                  sentAt: johnMessage2.sentAt,
                },
              ],
            },
          },
          {
            type: chatItemType.GROUP_MESSAGE,
            messageGroupData: {
              sender: 'Jane Doe',
              messages: [
                {
                  content: janeMessage1.content,
                  sentAt: janeMessage1.sentAt,
                },
              ],
            },
          },
          {
            type: chatItemType.GROUP_MESSAGE,
            messageGroupData: {
              sender: 'Jane Doe',
              messages: [
                {
                  content: janeMessage2.content,
                  sentAt: janeMessage2.sentAt,
                },
              ],
            },
          },
        ],
      }),
    );
  });
});
