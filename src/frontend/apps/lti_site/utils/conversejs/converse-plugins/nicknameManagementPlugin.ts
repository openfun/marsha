import { PROSODY_TIMEOUT_ON_NICKNAME_CHANGE_REQUEST_IN_MS } from 'default/chat';
import { XMPP } from 'lib-components';
import { converse } from 'utils/window';

const PLUGIN_NAME = 'nickname-management-plugin';

const addNicknameManagementPlugin = (xmpp: XMPP) =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      const claimNewNicknameInChatRoom = (
        newNickname: string,
        callbackSuccess: () => void,
        callbackError: (stanza: HTMLElement) => void,
      ): void => {
        const completeCallbackSuccess = () => {
          callbackSuccess();
          _converse.api.settings.set('nickname', newNickname);
        };
        const presence = converse.env.$pres({
          from: _converse.connection.jid,
          to: xmpp.conference_url + '/' + newNickname,
        });
        _converse.connection.sendPresence(
          presence,
          completeCallbackSuccess,
          callbackError,
          PROSODY_TIMEOUT_ON_NICKNAME_CHANGE_REQUEST_IN_MS,
        );
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
