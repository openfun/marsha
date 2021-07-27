import 'converse.js/dist/converse.min.css';
import 'converse.js/dist/converse.min.js';
import 'converse.js/dist/emojis.js';
import 'converse.js/dist/icons.js';

import { converse } from './window';
import { getDecodedJwt } from '../data/appData';
import { useJoinParticipant } from '../data/stores/useJoinParticipant';
import { useParticipantWorkflow } from '../data/stores/useParticipantWorkflow';
import { XMPP } from '../types/tracks';
import { Participant } from '../types/Participant';

export const converseMounter = () => {
  let hasBeenInitialized = false;

  return (containerName: string, xmpp: XMPP) => {
    if (hasBeenInitialized) {
      converse.insertInto(document.querySelector(containerName)!);
    } else {
      converse.initialize({
        allow_contact_requests: false,
        allow_logout: false,
        allow_message_corrections: 'last',
        allow_message_retraction: 'all',
        allow_muc_invitations: false,
        allow_registration: false,
        authentication: 'anonymous',
        auto_login: true,
        auto_join_rooms: [xmpp.conference_url],
        bosh_service_url: xmpp.bosh_url,
        clear_cache_on_logout: true,
        discover_connection_methods: false,
        hide_muc_participants: true,
        jid: xmpp.jid,
        modtools_disable_assign: true,
        muc_instant_rooms: false,
        nickname: getDecodedJwt().user?.username,
        root: document.querySelector(containerName),
        show_client_info: false,
        singleton: true,
        theme: 'concord',
        view_mode: 'embedded',
        visible_toolbar_buttons: {
          call: false,
          emoji: true,
          spoiler: false,
          toggle_occupants: false,
        },
        whitelisted_plugins: ['marsha', 'marsha-join-discussion'],
      });
      converse.plugins.add('marsha', {
        initialize() {
          const _converse = this._converse;

          window.addEventListener('beforeunload', () => {
            _converse.api.user.logout();
          });
        },
      });
      converse.plugins.add('marsha-join-discussion', {
        initialize() {
          const _converse = this._converse;

          _converse.on('initialized', () => {
            _converse.connection.addHandler(
              (message: any) => {
                if (
                  message.getAttribute('type') === 'groupchat' &&
                  message.getAttribute('event') === 'participantAskToMount'
                ) {
                  const jid = message.getAttribute('from');
                  const username = converse.env.Strophe.getResourceFromJid(jid);
                  useJoinParticipant
                    .getState()
                    .addParticipantAskingToJoin({ id: jid, name: username });
                } else if (
                  message.getAttribute('type') === 'event' &&
                  message.getAttribute('event') === 'accept'
                ) {
                  // TODO redirect to jitsi public dashboard
                  useParticipantWorkflow.getState().setAccepted();
                } else if (
                  message.getAttribute('type') === 'event' &&
                  message.getAttribute('event') === 'reject'
                ) {
                  // TODO display message to participant saying is request is not accepted
                  useParticipantWorkflow.getState().setRejected();
                } else if (
                  message.getAttribute('type') === 'event' &&
                  message.getAttribute('event') === 'kick'
                ) {
                  useParticipantWorkflow.getState().setKicked();
                } else if (
                  message.getAttribute('type') === 'groupchat' &&
                  message.getAttribute('event') === 'leave'
                ) {
                  const jid = message.getAttribute('from');
                  const username = converse.env.Strophe.getResourceFromJid(jid);
                  useJoinParticipant
                    .getState()
                    .removeParticipantInDiscussion({ id: jid, name: username });
                }
                return true;
              },
              null,
              'message',
              null,
              null,
              null,
            );

            const askParticipantToMount = () => {
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: xmpp.conference_url,
                type: 'groupchat',
                event: 'participantAskToMount',
              });
              _converse.connection.send(msg);
            };

            const acceptParticipantToMount = (participant: Participant) => {
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: participant.id,
                type: 'event',
                event: 'accept',
              });
              _converse.connection.send(msg);
            };

            const rejectParticipantToMount = (participant: Participant) => {
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: participant.id,
                type: 'event',
                event: 'reject',
              });
              _converse.connection.send(msg);
            };

            const kickParticipant = (participant: Participant) => {
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: participant.id,
                type: 'event',
                event: 'kick',
              });
              _converse.connection.send(msg);
            };

            const participantLeaves = () => {
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: xmpp.conference_url,
                type: 'groupchat',
                event: 'leave',
              });
              _converse.connection.send(msg);
            };

            Object.assign(converse, {
              acceptParticipantToMount,
              askParticipantToMount,
              kickParticipant,
              rejectParticipantToMount,
              participantLeaves,
            });
          });
        },
      });
      hasBeenInitialized = true;
    }
  };
};
