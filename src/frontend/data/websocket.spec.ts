import { waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import WS from 'jest-websocket-mock';
import { v4 as uuidv4 } from 'uuid';

import { modelName } from 'types/models';
import { getOrInitAnonymousId } from 'utils/getOrInitAnonymousId';
import { videoMockFactory } from 'utils/tests/factories';
import { getDecodedJwt } from './appData';
import { useVideo } from './stores/useVideo';

jest.mock('./appData', () => ({
  appData: { jwt: 'cool_token_m8' },
  getDecodedJwt: jest.fn(),
}));

jest.mock('utils/getOrInitAnonymousId', () => ({
  getOrInitAnonymousId: jest.fn(),
}));

const mockGetDecodedJwt = getDecodedJwt as jest.MockedFunction<
  typeof getDecodedJwt
>;
const mockGetOrInitAnonymousId = getOrInitAnonymousId as jest.MockedFunction<
  typeof getOrInitAnonymousId
>;

const publicToken = {
  locale: 'en',
  maintenance: false,
  permissions: {
    can_access_dashboard: false,
    can_update: false,
  },
  resource_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
  roles: ['none'],
  session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
};

const ltiToken = {
  context_id: 'course-v1:ufr+mathematics+0001',
  consumer_site: '112cf553-b8c3-4b98-9d47-d0793284b9b3',
  locale: 'en_US',
  maintenance: false,
  permissions: {
    can_access_dashboard: false,
    can_update: false,
  },
  resource_id: '26debfee-8c3b-4c23-b08f-67f223de9832',
  roles: ['student'],
  session_id: '6bbb8d1d-442d-4575-a0ad-d1e34f37cae3',
  user: {
    email: 'sarah@test-mooc.fr',
    id: 'aaace992-49e3-4e01-b809-7a84b1b55b72',
    username: null,
  },
};

describe('initVideoWebsocket', () => {
  afterEach(() => fetchMock.restore());
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('connects to the websocket and updates video zustand store when message is received', async () => {
    let initVideoWebsocket: any;
    jest.isolateModules(() => {
      initVideoWebsocket = require('./websocket').initVideoWebsocket;
    });
    const video = videoMockFactory();
    useVideo.getState().addResource(video);
    const server = new WS(`ws://localhost:1234/ws/video/${video.id}/`);

    mockGetDecodedJwt.mockReturnValue(ltiToken);

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

    expect(mockGetOrInitAnonymousId).not.toHaveBeenCalled();

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

  it('connects to the websocket using an anonymous id', async () => {
    let initVideoWebsocket: any;
    jest.isolateModules(() => {
      initVideoWebsocket = require('./websocket').initVideoWebsocket;
    });
    const video = videoMockFactory();
    useVideo.getState().addResource(video);
    const server = new WS(`ws://localhost:1234/ws/video/${video.id}/`);

    mockGetDecodedJwt.mockReturnValue(publicToken);
    mockGetOrInitAnonymousId.mockReturnValue(uuidv4());

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

    expect(mockGetOrInitAnonymousId).toHaveBeenCalled();

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

    mockGetDecodedJwt.mockReturnValue(ltiToken);

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

    expect(mockGetOrInitAnonymousId).not.toHaveBeenCalled();

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

  it('reconnects to the server after a disconnection and fetch the video data.', async () => {
    let initVideoWebsocket: any;
    jest.isolateModules(() => {
      initVideoWebsocket = require('./websocket').initVideoWebsocket;
    });
    const video = videoMockFactory();
    fetchMock.mock(
      `/api/videos/${video.id}/`,
      JSON.stringify({
        ...video,
        title: 'updated title',
      }),
    );
    useVideo.getState().addResource(video);
    const server = new WS(`wss://localhost:4321/ws/video/${video.id}/`);

    mockGetDecodedJwt.mockReturnValue(ltiToken);

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

    expect(mockGetOrInitAnonymousId).not.toHaveBeenCalled();

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

    expect(fetchMock.called(`/api/videos/${video.id}/`)).toEqual(false);

    server.close({
      code: 3012,
      reason: 'connection lost',
      wasClean: false,
    });

    const newServer = new WS(`wss://localhost:4321/ws/video/${video.id}/`);
    await newServer.connected;

    await waitFor(() => {
      expect(useVideo.getState().getVideo(video)).toEqual({
        ...video,
        title: 'updated title',
      });
    });

    expect(fetchMock.called(`/api/videos/${video.id}/`)).toEqual(true);

    server.close();
    WS.clean();
  });
});
