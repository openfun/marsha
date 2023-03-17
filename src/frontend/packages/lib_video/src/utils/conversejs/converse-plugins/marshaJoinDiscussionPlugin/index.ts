/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Maybe } from 'lib-common';
import {
  fetchJitsiInfo,
  Participant,
  Video,
  EventType,
  MessageType,
  VideoJitsiConnectionInfos,
  XMPP,
} from 'lib-components';

import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';
import { converse } from '@lib-video/utils/window';

import marshaJoinDiscussionPluginHandler from './handler';

const PLUGIN_NAME = 'marsha-join-discussion-plugin';

const addMarshaJoinDiscussionPlugin = (xmpp: XMPP, video: Video) =>
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
          async (messageStanza: any) => {
            const jid = messageStanza.getAttribute('from');
            const username = converse.env.Strophe.getResourceFromJid(jid);
            return await marshaJoinDiscussionPluginHandler(
              messageStanza,
              username,
              video,
            );
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

      const acceptParticipantToJoin = async (
        participant: Participant,
        aVideo: Video,
      ) => {
        // only instructors or admin have update permissions
        if (!video.can_edit) {
          return;
        }

        let jitsiInfo: Maybe<VideoJitsiConnectionInfos>;
        if (
          aVideo.live_info.jitsi &&
          aVideo.live_info.jitsi.hasOwnProperty('token')
        ) {
          // When the original jitsi info has a token property, it means
          // jitsi needs a token to connect to it. This token must be refeshed
          // without moderation permission and a valid lifetime.
          jitsiInfo = await fetchJitsiInfo(aVideo);
        } else {
          // Otherwise, jitsi is in anonymous mode, no more info to fetch on the api,
          // all already existing info can be send to the student.
          jitsiInfo = aVideo.live_info.jitsi;
        }

        // send message to user to accept joining the discussion
        const msg = converse.env.$msg({
          from: _converse.connection.jid,
          to: participant.id,
          type: MessageType.EVENT,
          event: EventType.ACCEPT,
          jitsi: JSON.stringify(jitsiInfo),
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
        // only instructors or admin have update permissions
        if (!video.can_edit) {
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
        // only instructors or admin have update permissions
        if (!video.can_edit) {
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
