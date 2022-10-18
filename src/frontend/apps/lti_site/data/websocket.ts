import RobustWebSocket from 'altamoon-robust-websocket';
import { decodeJwt, useJwt } from 'lib-components';

import { addResource } from 'data/stores/generics';
import { WS_ENPOINT } from 'settings';
import { modelName } from 'types/models';
import { UploadableObject, Video } from 'lib-components';
import { checkLtiToken } from 'utils/checkLtiToken';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

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
  if (videoWebsocket) {
    return;
  }

  const { jwt } = useJwt.getState();

  const location = window.location;
  const wsProto = location.protocol.startsWith('https') ? 'wss' : 'ws';
  let url = `${wsProto}://${location.host}${WS_ENPOINT}/video/${video.id}/?jwt=${jwt}`;
  if (!checkLtiToken(decodeJwt(jwt))) {
    const anonymousId = getOrInitAnonymousId();
    url = `${url}&anonymous_id=${anonymousId}`;
  }

  videoWebsocket = new RobustWebSocket(url, null, {
    shouldReconnect: (event, ws) => {
      // code 4003 is used by marsha backend to close the connection
      // when the JWT token is not valid or does not match the current video.
      if (event.code === 4003) {
        return;
      }
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
