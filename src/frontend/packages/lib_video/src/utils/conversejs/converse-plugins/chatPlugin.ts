/* eslint-disable default-case */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { MessageType, XMPP } from 'lib-components';
import { DateTime } from 'luxon';

import {
  ReceivedMessageType,
  useChatItemState,
} from '@lib-video/hooks/useChatItemsStore';
import { converse } from '@lib-video/utils/window';

enum StanzaType {
  IQ = 'iq',
  MESSAGE = 'message',
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

      _converse.api.listen.on('cleanup', () => {
        useChatItemState.getState().reset();
      });

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
                }

                break;

              case StanzaType.IQ:
                if (stanza.getElementsByTagName('fin')[0]) {
                  useChatItemState
                    .getState()
                    .setHasReceivedMessageHistory(true);
                }
                break;
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
  const msgType = msgStanza.getAttribute('type') as MessageType;

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
