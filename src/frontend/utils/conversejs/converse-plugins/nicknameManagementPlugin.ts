import { XMPP } from 'types/XMPP';
import { converse } from 'utils/window';

const PLUGIN_NAME = 'nickname-management-plugin';

const addNicknameManagementPlugin = (xmpp: XMPP) =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      const claimNewNicknameInChatRoom = (newNickname: string): void => {
        const presence = converse.env.$pres({
          from: _converse.connection.jid,
          to: xmpp.conference_url + '/' + newNickname,
        });
        _converse.connection.send(presence);
      };

      Object.assign(converse, {
        claimNewNicknameInChatRoom,
      });
    },
  });

export const nicknameManagementPlugin = {
  name: PLUGIN_NAME,
  addPlugin: addNicknameManagementPlugin,
};
