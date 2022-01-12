import { DateTime } from 'luxon';

import {
  chatItemType,
  presenceType,
  ReceivedMessageType,
  useChatItemState,
} from 'data/stores/useChatItemsStore';
import { MessageType, XMPP } from 'types/XMPP';
import { report } from 'utils/errors/report';
import { converse } from 'utils/window';
import { ANONYMOUS_ID_PREFIX } from 'utils/chat/chat';

enum StanzaType {
  IQ = 'iq',
  MESSAGE = 'message',
  PRESENCE = 'presence',
}

enum StanzaMessageType {
  LIVE_MESSAGE = 'LIVE_MESSAGE',
  HISTORY = 'HISTORY',
  SUBJECT = 'SUBJECT',
  UNRECOGNIZED = 'UNRECOGNIZED',
}

const PLUGIN_NAME = 'chat-plugin';

const addChatPlugin = (xmpp: XMPP) =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      _converse.on('initialized', () => {
        _converse.connection.addHandler(
          (stanza: HTMLElement) => {
            switch (stanza.nodeName) {
              case StanzaType.MESSAGE:
                switch (determineMessageType(stanza)) {
                  case StanzaMessageType.LIVE_MESSAGE:
                    const liveMessage: ReceivedMessageType = {
                      // Non-nullity is already ensured by determineMessageType()
                      content:
                        stanza.getElementsByTagName('body')[0].textContent!,
                      sender: getNameFromJID(stanza.getAttribute('from')!),
                      sentAt: DateTime.now(),
                    };
                    useChatItemState.getState().addMessage(liveMessage);
                    break;
                  case StanzaMessageType.HISTORY:
                    const historyMsgStanza =
                      stanza.getElementsByTagName('message')[0];
                    const historyMessage: ReceivedMessageType = {
                      // Non-nullity is already ensured by determineMessageType()
                      content:
                        historyMsgStanza.getElementsByTagName('body')[0]
                          .textContent!,
                      sender: getNameFromJID(
                        historyMsgStanza.getAttribute('from')!,
                      ),
                      sentAt: getMsgDateTimeFromStanza(stanza),
                    };
                    useChatItemState.getState().addMessage(historyMessage);
                    break;
                  case StanzaMessageType.SUBJECT:
                    break;
                  case StanzaMessageType.UNRECOGNIZED:
                  default:
                    report(
                      new Error(
                        `Unable to recognize the following received message : \n ${stanza.outerHTML}`,
                      ),
                    );
                }

                break;

              case StanzaType.PRESENCE:
                const stanzaFrom = stanza.getAttribute('from');
                const stanzaTo = stanza.getAttribute('to');
                const items = stanza.getElementsByTagName('item');
                if (!stanzaFrom || !stanzaTo || !items.length) {
                  break;
                }
                const sender = getNameFromJID(stanzaFrom);
                const item = items[0];
                // Anonymous are not annouced in the chat
                if (
                  sender.startsWith(ANONYMOUS_ID_PREFIX + '-') ||
                  !item ||
                  item.getAttribute('affiliation') === 'none'
                ) {
                  break;
                }

                const receivedAt = DateTime.now();
                let type: presenceType;
                if (
                  stanza.getAttribute('type') &&
                  stanza.getAttribute('type') === 'unavailable'
                ) {
                  type = presenceType.DEPARTURE;
                } else {
                  type = presenceType.ARRIVAL;
                }
                // If the new presence is of the same type as the last one it is not registered
                const listSenderPresences = useChatItemState
                  .getState()
                  .chatItems.map((chatItem) => {
                    if (chatItem.type === chatItemType.PRESENCE) {
                      return chatItem.presenceData;
                    }
                  })
                  .filter((presence) => presence?.sender === sender);
                const lastSenderPresence =
                  listSenderPresences[listSenderPresences.length - 1];
                if (
                  (!lastSenderPresence || lastSenderPresence.type !== type) &&
                  useChatItemState.getState().hasReceivedMessageHistory
                ) {
                  useChatItemState.getState().addPresence({
                    receivedAt,
                    sender,
                    type,
                  });
                }
                break;

              case StanzaType.IQ:
                if (stanza.getElementsByTagName('fin')[0]) {
                  useChatItemState
                    .getState()
                    .setHasReceivedMessageHistory(true);
                }
                break;

              default:
                report(
                  new Error(
                    `Unable to recognize the following received xml stanza : \n ${stanza.outerHTML}`,
                  ),
                );
            }

            return true;
          },
          null,
          null,
          null,
          null,
          null,
        );
      });

      const sendMessage = (message: string): void => {
        const msg = converse.env
          .$msg({
            from: _converse.connection.jid,
            to: xmpp.conference_url,
            type: MessageType.GROUPCHAT,
          })
          .c('body')
          .t(message);
        _converse.connection.send(msg);
      };

      Object.assign(converse, {
        sendMessage,
      });
    },
  });

const determineMessageType = (msgStanza: HTMLElement): StanzaMessageType => {
  const forwardedMessage = msgStanza.getElementsByTagName('message')[0];
  const msgType = msgStanza.getAttribute('type');

  if (msgType && msgType === MessageType.GROUPCHAT) {
    const msgBody = msgStanza.getElementsByTagName('body')[0];
    const msgSubject = msgStanza.getElementsByTagName('subject')[0];
    if (msgBody && msgBody.textContent && msgStanza.getAttribute('from')) {
      return StanzaMessageType.LIVE_MESSAGE;
    } else if (msgSubject) {
      return StanzaMessageType.SUBJECT;
    }
  } else if (
    forwardedMessage &&
    forwardedMessage.textContent &&
    forwardedMessage.getAttribute('from')
  ) {
    return StanzaMessageType.HISTORY;
  }

  return StanzaMessageType.UNRECOGNIZED;
};

const getNameFromJID = (jid: string): string => {
  return converse.env.Strophe.getResourceFromJid(jid);
};

const getMsgDateTimeFromStanza = (stanza: HTMLElement): DateTime => {
  return DateTime.fromISO(
    stanza.getElementsByTagName('delay')[0].getAttribute('stamp')!,
  );
};

export const chatPlugin = {
  name: PLUGIN_NAME,
  addPlugin: addChatPlugin,
};
