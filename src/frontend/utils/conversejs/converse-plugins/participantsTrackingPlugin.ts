import { useParticipantsStore } from 'data/stores/useParticipantsStore';
import { converse } from 'utils/window';

const PLUGIN_NAME = 'participants-tracking-plugin';

const addParticipantsTrackingPlugin = () =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      _converse.on('initialized', () => {
        _converse.connection.addHandler(
          (stanza: HTMLElement) => {
            if (
              stanza.getAttribute('from') !== null &&
              stanza.getAttribute('to') !== null
            ) {
              const participantDisplayName = getNameFromJID(
                stanza.getAttribute('from')!,
              );
              if (
                stanza.getAttribute('type') !== null &&
                stanza.getAttribute('type') === 'unavailable'
              ) {
                useParticipantsStore
                  .getState()
                  .removeParticipant(participantDisplayName);
              } else if (
                stanza.getElementsByTagName('item')[0] !== null &&
                stanza
                  .getElementsByTagName('item')[0]
                  .getAttribute('affiliation') !== null &&
                stanza
                  .getElementsByTagName('item')[0]
                  .getAttribute('affiliation') !== 'none'
              ) {
                const participantIsInstructor =
                  stanza
                    .getElementsByTagName('item')[0]
                    .getAttribute('affiliation') === 'owner';
                useParticipantsStore.getState().addParticipant({
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
