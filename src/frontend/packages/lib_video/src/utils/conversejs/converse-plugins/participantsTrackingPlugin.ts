/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { useParticipantsStore } from '@lib-video/hooks/useParticipantsStore';
import { converse } from '@lib-video/utils/window';

const PLUGIN_NAME = 'participants-tracking-plugin';

const addParticipantsTrackingPlugin = () =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      _converse.on('initialized', () => {
        _converse.connection.addHandler(
          (stanza: HTMLElement) => {
            const jid = stanza.getAttribute('from');
            if (jid && stanza.getAttribute('to')) {
              const item = stanza.getElementsByTagName('item')[0];
              const participantDisplayName = getNameFromJID(jid);
              if (
                stanza.getAttribute('type') &&
                stanza.getAttribute('type') === 'unavailable'
              ) {
                useParticipantsStore
                  .getState()
                  .removeParticipant(participantDisplayName);
              } else if (
                item &&
                item.getAttribute('affiliation') &&
                item.getAttribute('affiliation') !== 'none'
              ) {
                const participantIsInstructor =
                  item.getAttribute('affiliation') === 'owner';
                useParticipantsStore.getState().addParticipant({
                  id: jid,
                  userJid: _converse.api.user.jid(),
                  isInstructor: participantIsInstructor,
                  isOnStage: false,
                  name: participantDisplayName,
                });
              }
            }
            return true;
          },
          null,
          'presence',
          null,
          null,
          null,
        );
      });
    },
  });

const getNameFromJID = (jid: string): string => {
  return converse.env.Strophe.getResourceFromJid(jid);
};

export const participantsTrackingPlugin = {
  name: PLUGIN_NAME,
  addPlugin: addParticipantsTrackingPlugin,
};
