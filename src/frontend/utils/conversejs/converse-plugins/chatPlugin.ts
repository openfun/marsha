import { DateTime } from 'luxon';

import {
  ChatMessageType,
  useMessagesState,
} from 'data/stores/useMessagesStore';
import { MessageType, XMPP } from 'types/XMPP';
import { report } from 'utils/errors/report';
import { converse } from 'utils/window';

enum StanzaType {
  IQ = 'iq',
  MESSAGE = 'message',
  PRESENCE = 'presence',
}

enum StanzaMessageType {
  CLASSIC_MESSAGE = 'CLASSIC_MESSAGE',
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
                  case StanzaMessageType.CLASSIC_MESSAGE:
                    const msg: ChatMessageType = {
                      sentAt: DateTime.now(),
                      sender: getNameFromJID(stanza.getAttribute('from')!),
                      content:
                        stanza.getElementsByTagName('body')[0].textContent!,
                    };
                    useMessagesState.getState().addMessage(msg);
                    break;
                  case StanzaMessageType.HISTORY:
                    const oldMsgStanza =
                      stanza.getElementsByTagName('message')[0];
                    const oldMsg: ChatMessageType = {
                      sentAt: getMsgDateTimeFromStanza(stanza),
                      sender: getNameFromJID(
                        oldMsgStanza.getAttribute('from')!,
                      ),
                      content:
                        oldMsgStanza.getElementsByTagName('body')[0]
                          .textContent!,
                    };
                    useMessagesState.getState().addMessage(oldMsg);
                    break;
                }

                break;

              case StanzaType.PRESENCE:
                break;

              case StanzaType.IQ:
                break;

              default:
                report(
                  new Error(
                    `Unable to recognize the following received xml stanza : \n ${stanza}`,
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
  if (
    msgStanza.getAttribute('type') !== null &&
    msgStanza.getAttribute('type') === MessageType.GROUPCHAT
  ) {
    if (msgStanza.getElementsByTagName('subject')[0] !== undefined) {
      return StanzaMessageType.SUBJECT;
    } else if (msgStanza.getElementsByTagName('body')[0] !== undefined) {
      return StanzaMessageType.CLASSIC_MESSAGE;
    }
  } else if (msgStanza.getElementsByTagName('message')[0] !== undefined) {
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
