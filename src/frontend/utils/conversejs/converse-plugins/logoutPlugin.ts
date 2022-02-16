import { converse } from 'utils/window';

const PLUGIN_NAME = 'logout-plugin';

const addLogoutPlugin = () =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      window.addEventListener('beforeunload', () => {
        _converse.api.user.logout();
      });

      const sendRetractionIQ = (stanzaId: string, reason: string) => {
        const iq = converse.env
          .$iq({
            to: 'd19a24d1-c728-4c8d-ad66-f4e9f7d082a3@conference.prosody',
            type: 'set',
          })
          .c(
            'apply-to',
            { id: stanzaId },
            { xmlns: converse.env.Strophe.NS.FASTEN },
          )
          .c('moderate', { xmlns: converse.env.Strophe.NS.MODERATE })
          .c('retract', { xmlns: converse.env.Strophe.NS.RETRACT })
          .up()
          .c('reason')
          .t(reason || '');
        return _converse.api.sendIQ(iq, null, false);
      };

      Object.assign(converse, {
        getConverse: () => _converse,
        sendRetractionIQ,
      });
    },
  });

export const logoutPlugin = {
  name: PLUGIN_NAME,
  addPlugin: addLogoutPlugin,
};
