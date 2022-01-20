import { waitFor } from '@testing-library/react';
import WS from 'jest-websocket-mock';

import { modelName } from 'types/models';
import { videoMockFactory } from 'utils/tests/factories';
import { useVideo } from './stores/useVideo';
import { initVideoWebsocket } from './websocket';

jest.mock('data/appData', () => ({
  appData: { jwt: 'cool_token_m8' },
}));

describe('initVideoWebsocket', () => {
  it('connects to the websocket and updates video zustand store when message is received', async () => {
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
    });

    initVideoWebsocket(video);
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
});
