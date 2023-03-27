/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';
import { converse } from '@lib-video/utils/window';

const PLUGIN_NAME = 'logout-plugin';

const addLogoutPlugin = () =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      const logout = async () => {
        if (useParticipantWorkflow.getState().accepted) {
          converse.participantLeaves();
        }
        await _converse.api.user.logout();
      };

      window.addEventListener('beforeunload', () => {
        logout();
      });

      Object.assign(converse, {
        logout,
      });
    },
  });

export const logoutPlugin = {
  name: PLUGIN_NAME,
  addPlugin: addLogoutPlugin,
};
