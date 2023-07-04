import { Server } from 'bittorrent-tracker';
import express from 'express';
import { WebSocketServer } from 'ws';

import { verifyClient } from './verifyClient.js';

const app = express();
const port = process.env.APP_PORT ?? 3000;

const webtorrentServer = new Server({
  http: false, // we do our own
  udp: false, // not interested
  ws: false // not interested
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
  websocket.handleUpgrade(request, socket as any, head, ws => websocket.emit('connection', ws, request));
});
