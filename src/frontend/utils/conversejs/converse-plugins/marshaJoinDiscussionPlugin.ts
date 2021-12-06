import { appData, getDecodedJwt } from 'data/appData';
import { useJoinParticipant } from 'data/stores/useJoinParticipant';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { useVideo } from 'data/stores/useVideo';
import { Participant } from 'types/Participant';
import { Video } from 'types/tracks';
import { EventType, MessageType, XMPP } from 'types/XMPP';
import { converse } from './../../window';

const PLUGIN_NAME = 'marsha-join-discussion-plugin';

const addMarshaJoinDiscussionPlugin = (xmpp: XMPP) =>
  converse.plugins.add(PLUGIN_NAME, {
    dependencies: ['converse-muc'],
    initialize() {
      const _converse = this._converse;
      let joinedRoom = false;
      _converse.on('chatRoomInitialized', (model: any) => {
        model.session.on('change:connection_status', (currentSession: any) => {
          if (
            currentSession.get('connection_status') ===
            converse.ROOMSTATUS.ENTERED
          ) {
            joinedRoom = true;
          }
          if (
            currentSession.get('connection_status') ===
            converse.ROOMSTATUS.DISCONNECTED
          ) {
            joinedRoom = false;
          }

          if (
            currentSession.get('connection_status') ===
              converse.ROOMSTATUS.NICKNAME_REQUIRED &&
            useParticipantWorkflow.getState().asked
          ) {
            useParticipantWorkflow.getState().setUsernameAlreadyExisting();
          }
        });
      });

      _converse.on('enteredNewRoom', () => {
        joinedRoom = true;
        if (useParticipantWorkflow.getState().asked) {
          askParticipantToJoin();
        }
      });

      _converse.on('initialized', () => {
        _converse.connection.addHandler(
          (messageStanza: any) => {
            if (
              getDecodedJwt().permissions.can_update &&
              messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
              messageStanza.getAttribute('event') ===
                EventType.PARTICIPANT_ASK_TO_JOIN
            ) {
              const jid = messageStanza.getAttribute('from');
              const username = converse.env.Strophe.getResourceFromJid(jid);
              useJoinParticipant
                .getState()
                .addParticipantAskingToJoin({ id: jid, name: username });
            } else if (
              getDecodedJwt().permissions.can_update &&
              messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
              messageStanza.getAttribute('event') === EventType.ACCEPTED
            ) {
              const participant = JSON.parse(
                messageStanza.getAttribute('participant'),
              );
              useJoinParticipant
                .getState()
                .moveParticipantToDiscussion(participant);
            } else if (
              messageStanza.getAttribute('type') === MessageType.EVENT &&
              messageStanza.getAttribute('event') === EventType.ACCEPT
            ) {
              // retrieve current video in store
              const video = useVideo.getState().getVideo(appData.video!);
              // update video with jitsi info
              useVideo.getState().addResource({
                ...video,
                live_info: {
                  ...video.live_info,
                  jitsi: JSON.parse(messageStanza.getAttribute('jitsi')),
                },
              });

              useParticipantWorkflow.getState().setAccepted();
            } else if (
              messageStanza.getAttribute('type') === MessageType.EVENT &&
              messageStanza.getAttribute('event') === EventType.REJECT
            ) {
              useParticipantWorkflow.getState().setRejected();
            } else if (
              getDecodedJwt().permissions.can_update &&
              messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
              messageStanza.getAttribute('event') === EventType.REJECTED
            ) {
              const participant = JSON.parse(
                messageStanza.getAttribute('participant'),
              );
              useJoinParticipant
                .getState()
                .removeParticipantAskingToJoin(participant);
            } else if (
              messageStanza.getAttribute('type') === MessageType.EVENT &&
              messageStanza.getAttribute('event') === EventType.KICK
            ) {
              useParticipantWorkflow.getState().setKicked();
            } else if (
              getDecodedJwt().permissions.can_update &&
              messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
              messageStanza.getAttribute('event') === EventType.KICKED
            ) {
              const participant = JSON.parse(
                messageStanza.getAttribute('participant'),
              );
              useJoinParticipant
                .getState()
                .removeParticipantFromDiscussion(participant);
            } else if (
              getDecodedJwt().permissions.can_update &&
              messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
              messageStanza.getAttribute('event') === EventType.LEAVE
            ) {
              const jid = messageStanza.getAttribute('from');
              const username = converse.env.Strophe.getResourceFromJid(jid);
              useJoinParticipant.getState().removeParticipantFromDiscussion({
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
      });

      const askParticipantToJoin = async (username?: string) => {
        if (!joinedRoom && !username) {
          throw Error('must be in the room before asking to join');
        }
        // test if current user joined the room
        if (!joinedRoom && username) {
          const room = await _converse.api.rooms.get(
            xmpp.conference_url,
            {},
            false,
          );
          // try to join the room
          return room.join(username);
        }

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
        // only instructors or admin has update permissions
        if (!getDecodedJwt().permissions.can_update) {
          return;
        }

        // send message to user to accept joining the discussion
        const msg = converse.env.$msg({
          from: _converse.connection.jid,
          to: participant.id,
          type: MessageType.EVENT,
          event: EventType.ACCEPT,
          jitsi: JSON.stringify(video.live_info.jitsi),
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
        // only instructors or admin has update permissions
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
        // only instructors or admin has update permissions
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
    },
  });

export const marshaJoinDiscussionPlugin = {
  name: PLUGIN_NAME,
  addPlugin: addMarshaJoinDiscussionPlugin,
};
