import RobustWebSocket from 'altamoon-robust-websocket';

import { addResource } from 'data/stores/generics';
import { WS_ENPOINT } from 'settings';
import { modelName } from 'types/models';
import { UploadableObject, Video } from 'types/tracks';
import { checkLtiToken } from 'utils/checkLtiToken';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';

import { appData, getDecodedJwt } from './appData';

type WSMessageType = {
  resource: UploadableObject;
  type: modelName;
};

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
  videoWebsocket = new RobustWebSocket(url);

  videoWebsocket.addEventListener('message', async (message) => {
    const data: WSMessageType = JSON.parse(message.data);
    await addResource(data.type, data.resource);
  });
};
