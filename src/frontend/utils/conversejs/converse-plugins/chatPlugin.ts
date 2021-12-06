import { MessageType, XMPP } from 'types/XMPP';
import { converse } from 'utils/window';

const PLUGIN_NAME = 'chat-plugin';

const addChatPlugin = (xmpp: XMPP) =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

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

export const chatPlugin = {
  name: PLUGIN_NAME,
  addPlugin: addChatPlugin,
};
