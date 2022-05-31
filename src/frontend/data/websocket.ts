import RobustWebSocket from 'altamoon-robust-websocket';

import { addResource } from 'data/stores/generics';
import { WS_ENPOINT } from 'settings';
import { modelName } from 'types/models';
import { UploadableObject, Video } from 'types/tracks';
import { checkLtiToken } from 'utils/checkLtiToken';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

import { appData, getDecodedJwt } from './appData';
import { getResource } from './sideEffects/getResource';

type WSMessageType = {
  resource: UploadableObject;
  type: modelName;
};

interface OpenEvent extends Event {
  reconnects?: number;
}

let videoWebsocket: RobustWebSocket;

export const initVideoWebsocket = (video: Video) => {
  if (videoWebsocket) return;
  const location = window.location;
  const wsProto = location.protocol.startsWith('https') ? 'wss' : 'ws';
  let url = `${wsProto}://${location.host}${WS_ENPOINT}/video/${video.id}/?jwt=${appData.jwt}`;
  if (!checkLtiToken(getDecodedJwt())) {
    const anonymousId = getOrInitAnonymousId();
    url = `${url}&anonymous_id=${anonymousId}`;
  }

  videoWebsocket = new RobustWebSocket(url, null, {
    shouldReconnect: (_, ws) => {
      // On the first 10 attempts we try to reconnect immediatly.
      // Then the delay between each attempts is 500ms
      if (ws.attempts < 10) {
        return 0;
      }

      return 500;
    },
  });

  videoWebsocket.addEventListener('message', async (message) => {
    const data: WSMessageType = JSON.parse(message.data);
    await addResource(data.type, data.resource);
  });

  videoWebsocket.addEventListener('open', async (event: OpenEvent) => {
    if (event.reconnects && event.reconnects > 0) {
      await getResource(modelName.VIDEOS, video.id);
    }
  });
};
