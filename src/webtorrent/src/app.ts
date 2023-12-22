import { Server } from 'bittorrent-tracker';
import express from 'express';
import * as Sentry from '@sentry/node';
import { WebSocketServer } from 'ws';

import { verifyClient } from './verifyClient.js';

const app = express();
const port = process.env.APP_PORT ?? 3000;
const sentryDsn = process.env.SENTRY_DSN ?? '';
if (sentryDsn != null) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.WEBTORRENT_ENVIRONMENT,
    release: process.env.WEBTORRENT_RELEASE
  });
  Sentry.configureScope((scope) => scope.setExtra('application', 'webtorrent'));

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}

const webtorrentServer = new Server({
  http: false, // not interested
  udp: false, // not interested
  ws: false // we do our own
});

const websocket = new WebSocketServer({
  noServer: true,
  verifyClient
});

websocket.on('connection', (socket) => {
  webtorrentServer.onWebSocketConnection(socket);
});

const server = app.listen(port, () => {
  console.log(`Express server is listening at http://localhost:${port} 🚀`);
});

server.on('upgrade', (request, socket, head) => {
  websocket.handleUpgrade(request, socket, head, ws => websocket.emit('connection', ws, request));
});
