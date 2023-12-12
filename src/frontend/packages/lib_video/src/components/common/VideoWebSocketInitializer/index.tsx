import RobustWebSocket from 'altamoon-robust-websocket';
import { Nullable } from 'lib-common';
import {
  UploadableObject,
  addResource,
  getResource,
  modelName,
} from 'lib-components';
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  WEB_SOCKET_INITIALIZED,
  WebSocketInitializer,
  WebSocketInitializerProps,
} from './WebSocketInitializer';

type WSMessageType = {
  resource: UploadableObject;
  type: modelName;
};

interface OpenEvent extends Event {
  reconnects?: number;
}

interface VideoWebSocketInitializerProps extends WebSocketInitializerProps {
  videoId: string;
}

export const VideoWebSocketInitializer = ({
  children,
  videoId,
  ...props
}: PropsWithChildren<VideoWebSocketInitializerProps>) => {
  const videoSocket = useRef<Nullable<RobustWebSocket>>(null);
  const [isSetup, setIsSetup] = useState(false);

  //  every time we receive an update message within the socket, update the resource in the appropriate store
  const handleMessage = useCallback((message: MessageEvent<string>) => {
    const handle = () => {
      const data = JSON.parse(message.data) as WSMessageType;
      addResource(data.type, data.resource);
    };
    handle();
  }, []);

  const handleOpen = useCallback(
    (event: OpenEvent) => {
      const handle = async () => {
        if (event.reconnects && event.reconnects > 0) {
          await getResource(modelName.VIDEOS, videoId);
        }
      };
      handle();
    },
    [videoId],
  );

  useEffect(() => {
    videoSocket.current?.addEventListener('message', handleMessage);
    videoSocket.current?.addEventListener('open', handleOpen);

    return () => {
      videoSocket.current?.removeEventListener('message', handleMessage);
      videoSocket.current?.removeEventListener('open', handleOpen);
    };
  }, [handleMessage, handleOpen]);

  useEffect(() => {
    const listener = (event: Event) => {
      const socket = (
        event as CustomEvent<{
          socket: RobustWebSocket;
        }>
      ).detail.socket;
      videoSocket.current = socket;

      socket.addEventListener('message', handleMessage);
      socket.addEventListener('open', handleOpen);
    };
    window.addEventListener(WEB_SOCKET_INITIALIZED, listener);
    setIsSetup(true);

    return () => {
      window.removeEventListener(WEB_SOCKET_INITIALIZED, listener);
      setIsSetup(false);
    };
  }, [handleMessage, handleOpen]);

  useEffect(() => {
    return () => {
      videoSocket.current = null;
    };
  }, []);

  if (!isSetup) {
    return null;
  }

  return <WebSocketInitializer {...props}>{children}</WebSocketInitializer>;
};
