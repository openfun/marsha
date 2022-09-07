import 'altamoon-robust-websocket';

declare module 'altamoon-robust-websocket' {
  class RobustWebSocket extends WebSocket {
    constructor(
      streamUri: string | (() => string | Promise<string>),
      protocols?: Nullable<string>,
      options?: {
        timeout?: number;
        shouldReconnect?: (event: CloseEvent, ws: RobustWebSocket) => any;
        automaticOpen?: boolean;
        ignoreConnectivityEvents?: boolean;
      },
    );
    attempts: number;
    reconnects: number;
  }

  export = RobustWebSocket;
}
