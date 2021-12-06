import { MessageType, XMPP } from 'types/XMPP';
import { converse } from './../../window';

const PLUGIN_NAME = 'chat-plugin';

const addChatPlugin = (xmpp: XMPP) =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      const sendMessageWithConverse = (message: string): void => {
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
        sendMessageWithConverse,
      });
    },
  });

export const chatPlugin = {
  name: PLUGIN_NAME,
  addPlugin: addChatPlugin,
};
