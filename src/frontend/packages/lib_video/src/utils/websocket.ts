import RobustWebSocket from 'altamoon-robust-websocket';
import { WS_ENPOINT, useJwt } from 'lib-components';

export const generateVideoWebsocketUrl = (
  videoId: string,
  decorator?: (baseUrl: string) => string,
) => {
  const { jwt } = useJwt.getState();

  const location = window.location;
  const wsProto = location.protocol.startsWith('https') ? 'wss' : 'ws';
  const url = `${wsProto}://${
    location.host
  }${WS_ENPOINT}/video/${videoId}/?jwt=${jwt ?? ''}`;

  return decorator?.(url) ?? url;
};

export const initWebsocket = (url: string) => {
  return new RobustWebSocket(url, null, {
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
};
