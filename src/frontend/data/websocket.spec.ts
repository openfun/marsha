import { waitFor } from '@testing-library/react';
import WS from 'jest-websocket-mock';

import { modelName } from 'types/models';
import { videoMockFactory } from 'utils/tests/factories';
import { useVideo } from './stores/useVideo';

jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

describe('initVideoWebsocket', () => {
  it('connects to the websocket and updates video zustand store when message is received', async () => {
    let initVideoWebsocket: any;
    jest.isolateModules(() => {
      initVideoWebsocket = require('./websocket').initVideoWebsocket;
    });
    const video = videoMockFactory();
    useVideo.getState().addResource(video);
    const server = new WS(`ws://localhost:1234/ws/video/${video.id}/`);

    global.window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:1234/',
        host: 'localhost:1234',
        protocol: 'http',
      },
      writable: true,
    });

    initVideoWebsocket!(video);
    await server.connected;

    const updatedVideo = {
      ...video,
      title: 'updated title',
    };

    server.send(
      JSON.stringify({
        type: modelName.VIDEOS,
        resource: updatedVideo,
      }),
    );

    await waitFor(() => {
      expect(useVideo.getState().getVideo(video)).toEqual(updatedVideo);
    });

    server.close();
    WS.clean();
  });

  it('connects to the websocket using https protocol', async () => {
    let initVideoWebsocket: any;
    jest.isolateModules(() => {
      initVideoWebsocket = require('./websocket').initVideoWebsocket;
    });
    const video = videoMockFactory();
    useVideo.getState().addResource(video);
    const server = new WS(`wss://localhost:4321/ws/video/${video.id}/`);

    global.window = Object.create(window);
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://localhost:4321/',
        host: 'localhost:4321',
        protocol: 'https:',
      },
      writable: true,
    });

    initVideoWebsocket!(video);
    await server.connected;

    const updatedVideo = {
      ...video,
      title: 'updated title with https',
    };

    server.send(
      JSON.stringify({
        type: modelName.VIDEOS,
        resource: updatedVideo,
      }),
    );

    await waitFor(() => {
      expect(useVideo.getState().getVideo(video)).toEqual(updatedVideo);
    });

    server.close();
    WS.clean();
  });
});
