import RobustWebSocket from 'altamoon-robust-websocket';

import { addResource } from 'data/stores/generics';
import { WS_ENPOINT } from 'settings';
import { modelName } from 'types/models';
import { UploadableObject, Video } from 'types/tracks';

import { appData } from './appData';

type WSMessageType = {
  resource: UploadableObject;
  type: modelName;
};

let videoWebsocket: RobustWebSocket;

export const initVideoWebsocket = (video: Video) => {
  if (videoWebsocket) return;
  const location = window.location;
  const wsProto = location.protocol.startsWith('https') ? 'wss' : 'ws';
  videoWebsocket = new RobustWebSocket(
    `${wsProto}://${location.host}${WS_ENPOINT}/video/${video.id}/?jwt=${appData.jwt}`,
  );

  videoWebsocket.addEventListener('message', async (message) => {
    const data: WSMessageType = JSON.parse(message.data);
    await addResource(data.type, data.resource);
  });
};
