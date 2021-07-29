import 'converse.js/dist/converse.min.css';
import 'converse.js/dist/converse.min.js';
import 'converse.js/dist/emojis.js';
import 'converse.js/dist/icons.js';

import { converse } from './window';
import { getDecodedJwt } from '../data/appData';
import { useJoinParticipant } from '../data/stores/useJoinParticipant';
import { useParticipantWorkflow } from '../data/stores/useParticipantWorkflow';
import { Participant } from '../types/Participant';
import { Video } from '../types/tracks';
import { MessageType, EventType, XMPP } from '../types/XMPP';

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
        websocket_url: xmpp.websocket_url,
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
                  getDecodedJwt().permissions.can_update &&
                  message.getAttribute('type') === MessageType.GROUPCHAT &&
                  message.getAttribute('event') ===
                    EventType.PARTICIPANT_ASK_TO_JOIN
                ) {
                  const jid = message.getAttribute('from');
                  const username = converse.env.Strophe.getResourceFromJid(jid);
                  useJoinParticipant
                    .getState()
                    .addParticipantAskingToJoin({ id: jid, name: username });
                } else if (
                  getDecodedJwt().permissions.can_update &&
                  message.getAttribute('type') === MessageType.GROUPCHAT &&
                  message.getAttribute('event') === EventType.ACCEPTED
                ) {
                  const participant = JSON.parse(
                    message.getAttribute('participant'),
                  );
                  useJoinParticipant
                    .getState()
                    .moveParticipantToDiscussion(participant);
                } else if (
                  message.getAttribute('type') === MessageType.EVENT &&
                  message.getAttribute('event') === EventType.ACCEPT
                ) {
                  useParticipantWorkflow.getState().setAccepted();
                } else if (
                  message.getAttribute('type') === MessageType.EVENT &&
                  message.getAttribute('event') === EventType.REJECT
                ) {
                  useParticipantWorkflow.getState().setRejected();
                } else if (
                  getDecodedJwt().permissions.can_update &&
                  message.getAttribute('type') === MessageType.GROUPCHAT &&
                  message.getAttribute('event') === EventType.REJECTED
                ) {
                  const participant = JSON.parse(
                    message.getAttribute('participant'),
                  );
                  useJoinParticipant
                    .getState()
                    .removeParticipantAskingToJoin(participant);
                } else if (
                  message.getAttribute('type') === MessageType.EVENT &&
                  message.getAttribute('event') === EventType.KICK
                ) {
                  useParticipantWorkflow.getState().setKicked();
                } else if (
                  getDecodedJwt().permissions.can_update &&
                  message.getAttribute('type') === MessageType.GROUPCHAT &&
                  message.getAttribute('event') === EventType.KICKED
                ) {
                  const participant = JSON.parse(
                    message.getAttribute('participant'),
                  );
                  useJoinParticipant
                    .getState()
                    .removeParticipantFromDiscussion(participant);
                } else if (
                  getDecodedJwt().permissions.can_update &&
                  message.getAttribute('type') === MessageType.GROUPCHAT &&
                  message.getAttribute('event') === EventType.LEAVE
                ) {
                  const jid = message.getAttribute('from');
                  const username = converse.env.Strophe.getResourceFromJid(jid);
                  useJoinParticipant
                    .getState()
                    .removeParticipantFromDiscussion({
                      id: jid,
                      name: username,
                    });
                }
                return true;
              },
              null,
              'message',
              null,
              null,
              null,
            );

            const askParticipantToJoin = () => {
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: xmpp.conference_url,
                type: MessageType.GROUPCHAT,
                event: EventType.PARTICIPANT_ASK_TO_JOIN,
              });
              _converse.connection.send(msg);
            };

            const acceptParticipantToJoin = (
              participant: Participant,
              video: Video,
            ) => {
              // only instructors or admin has update persmissions
              if (!getDecodedJwt().permissions.can_update) {
                return;
              }

              // send messge to use to accept joining the discussion
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: participant.id,
                type: MessageType.EVENT,
                event: EventType.ACCEPT,
              });
              _converse.connection.send(msg);

              // broadcast message to other instructors to sync participant states
              const acceptedMsg = converse.env.$msg({
                from: _converse.connection.jid,
                to: xmpp.conference_url,
                type: MessageType.GROUPCHAT,
                event: EventType.ACCEPTED,
                participant: JSON.stringify(participant),
              });
              _converse.connection.send(acceptedMsg);
            };

            const rejectParticipantToJoin = (participant: Participant) => {
              // only instructors or admin has update persmission
              if (!getDecodedJwt().permissions.can_update) {
                return;
              }
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: participant.id,
                type: MessageType.EVENT,
                event: EventType.REJECT,
              });
              _converse.connection.send(msg);

              const rejectedMsg = converse.env.$msg({
                from: _converse.connection.jid,
                to: xmpp.conference_url,
                type: MessageType.GROUPCHAT,
                event: EventType.REJECTED,
                participant: JSON.stringify(participant),
              });
              _converse.connection.send(rejectedMsg);
            };

            const kickParticipant = (participant: Participant) => {
              // only instructors or admin has update persmission
              if (!getDecodedJwt().permissions.can_update) {
                return;
              }
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: participant.id,
                type: MessageType.EVENT,
                event: EventType.KICK,
              });
              _converse.connection.send(msg);

              const kickedMsg = converse.env.$msg({
                from: _converse.connection.jid,
                to: xmpp.conference_url,
                type: MessageType.GROUPCHAT,
                event: EventType.KICKED,
                participant: JSON.stringify(participant),
              });
              _converse.connection.send(kickedMsg);
            };

            const participantLeaves = () => {
              const msg = converse.env.$msg({
                from: _converse.connection.jid,
                to: xmpp.conference_url,
                type: MessageType.GROUPCHAT,
                event: EventType.LEAVE,
              });
              _converse.connection.send(msg);
            };

            Object.assign(converse, {
              acceptParticipantToJoin,
              askParticipantToJoin,
              kickParticipant,
              rejectParticipantToJoin,
              participantLeaves,
            });
          });
        },
      });
      hasBeenInitialized = true;
    }
  };
};
