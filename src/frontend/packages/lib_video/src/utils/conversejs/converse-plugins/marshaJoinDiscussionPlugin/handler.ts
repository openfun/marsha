/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useJwt,
  Video,
  useVideo,
  EventType,
  MessageType,
} from 'lib-components';

import {
  addParticipantAskingToJoin,
  moveParticipantToDiscussion,
  removeParticipantAskingToJoin,
  removeParticipantFromDiscussion,
} from '@lib-video/api/updateLiveParticipants';
import { useParticipantWorkflow } from '@lib-video/hooks/useParticipantWorkflow';

export default async function marshaJoinDiscussionPluginHandler(
  messageStanza: any,
  username: string,
  video: Video,
) {
  if (
    useJwt.getState().getDecodedJwt().permissions.can_update &&
    messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
    messageStanza.getAttribute('event') === EventType.PARTICIPANT_ASK_TO_JOIN
  ) {
    const jid = messageStanza.getAttribute('from');
    await addParticipantAskingToJoin(video, {
      id: jid,
      name: username,
    });
  } else if (
    useJwt.getState().getDecodedJwt().permissions.can_update &&
    messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
    messageStanza.getAttribute('event') === EventType.ACCEPTED
  ) {
    const participant = JSON.parse(messageStanza.getAttribute('participant'));
    await moveParticipantToDiscussion(video, participant);
  } else if (
    messageStanza.getAttribute('type') === MessageType.EVENT &&
    messageStanza.getAttribute('event') === EventType.ACCEPT
  ) {
    //  update the video value with the store before update it
    const updatedVideo = useVideo.getState().getVideo(video);

    // update video with jitsi info
    useVideo.getState().addResource({
      ...updatedVideo,
      live_info: {
        ...updatedVideo.live_info,
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
    useJwt.getState().getDecodedJwt().permissions.can_update &&
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
    useJwt.getState().getDecodedJwt().permissions.can_update &&
    messageStanza.getAttribute('type') === MessageType.GROUPCHAT &&
    messageStanza.getAttribute('event') === EventType.KICKED
  ) {
    const participant = JSON.parse(messageStanza.getAttribute('participant'));
    await removeParticipantFromDiscussion(video, participant);
  } else if (
    useJwt.getState().getDecodedJwt().permissions.can_update &&
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
