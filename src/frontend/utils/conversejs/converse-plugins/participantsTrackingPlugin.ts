import { appData, getDecodedJwt } from 'data/appData';
import { moveParticipantToDiscussion } from 'data/sideEffects/updateLiveParticipants';
import { useParticipantsStore } from 'data/stores/useParticipantsStore';
import { useVideo } from 'data/stores/useVideo';
import { JoinMode } from 'types/tracks';
import { converse } from 'utils/window';

const PLUGIN_NAME = 'participants-tracking-plugin';

const addParticipantsTrackingPlugin = () =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;

      _converse.on('initialized', () => {
        _converse.connection.addHandler(
          async (stanza: HTMLElement) => {
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
              } else if (item && item.getAttribute('affiliation')) {
                if (item.getAttribute('affiliation') !== 'none') {
                  const participantIsInstructor =
                    item.getAttribute('affiliation') === 'owner';
                  useParticipantsStore.getState().addParticipant({
                    id: jid,
                    isInstructor: participantIsInstructor,
                    isOnStage: false,
                    name: participantDisplayName,
                  });
                }
                const video = useVideo.getState().getVideo(appData.video!);
                if (
                  getDecodedJwt().permissions.can_update &&
                  video.join_mode === JoinMode.FORCED
                ) {
                  await moveParticipantToDiscussion(video, {
                    id: jid,
                    name: participantDisplayName,
                  });
                }
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
