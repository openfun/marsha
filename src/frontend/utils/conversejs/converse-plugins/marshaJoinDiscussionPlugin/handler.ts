import { getDecodedJwt } from 'data/appData';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { useVideo } from 'data/stores/useVideo';
import { Video } from 'types/tracks';
import { EventType, MessageType } from 'types/XMPP';
import {
  addParticipantAskingToJoin,
  moveParticipantToDiscussion,
  removeParticipantAskingToJoin,
  removeParticipantFromDiscussion,
} from 'data/sideEffects/updateLiveParticipants';

export default async function marshaJoinDiscussionPluginHandler(
  messageStanza: any,
  username: string,
  video: Video,
) {
  if (
    getDecodedJwt().permissions.can_update &&
    messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
    messageStanza.getAttribute('event') === EventType.PARTICIPANT_ASK_TO_JOIN
  ) {
    const jid = messageStanza.getAttribute('from');
    await addParticipantAskingToJoin(video, {
      id: jid,
      name: username,
    });
  } else if (
    getDecodedJwt().permissions.can_update &&
    messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
    messageStanza.getAttribute('event') === EventType.ACCEPTED
  ) {
    const participant = JSON.parse(messageStanza.getAttribute('participant'));
    await moveParticipantToDiscussion(video, participant);
  } else if (
    messageStanza.getAttribute('type') === MessageType.EVENT &&
    messageStanza.getAttribute('event') === EventType.ACCEPT
  ) {
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
    const participant = JSON.parse(messageStanza.getAttribute('participant'));
    await removeParticipantAskingToJoin(video, participant);
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
    const participant = JSON.parse(messageStanza.getAttribute('participant'));
    await removeParticipantFromDiscussion(video, participant);
  } else if (
    getDecodedJwt().permissions.can_update &&
    messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
    messageStanza.getAttribute('event') === EventType.LEAVE
  ) {
    const jid = messageStanza.getAttribute('from');
    await removeParticipantFromDiscussion(video, {
      id: jid,
      name: username,
    });
  }
  return true;
}
