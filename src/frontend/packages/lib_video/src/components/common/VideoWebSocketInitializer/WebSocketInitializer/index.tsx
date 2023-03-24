import RobustWebSocket from 'altamoon-robust-websocket';
import { Nullable } from 'lib-common';
import React, { Fragment, PropsWithChildren, useEffect, useRef } from 'react';

import { initWebsocket } from '@lib-video/utils/websocket';

export const WEB_SOCKET_INITIALIZED = 'WEB_SOCKET_INITIALIZED';

export interface WebSocketInitializerProps {
  url: string;
}

export const WebSocketInitializer = ({
  url,
  children,
}: PropsWithChildren<WebSocketInitializerProps>) => {
  const webSocketRef = useRef<Nullable<RobustWebSocket>>(null);

  useEffect(() => {
    const socket = initWebsocket(url);
    webSocketRef.current = socket;

    const event = new CustomEvent<{ socket: RobustWebSocket }>(
      WEB_SOCKET_INITIALIZED,
      { detail: { socket } },
    );
    window.dispatchEvent(event);

    return () => {
      webSocketRef.current?.close();
      webSocketRef.current = null;
    };
  }, [url]);

  return <Fragment>{children}</Fragment>;
};
