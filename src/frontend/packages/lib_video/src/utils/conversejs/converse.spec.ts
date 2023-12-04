import { PersistentStore, useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';

import { generateAnonymousNickname } from '@lib-video/utils/chat/chat';
import * as mockWindow from '@lib-video/utils/window';

import { converseCleanup, converseMounter } from './converse';
import { chatPlugin } from './converse-plugins/chatPlugin';
import { logoutPlugin } from './converse-plugins/logoutPlugin';
import { marshaJoinDiscussionPlugin } from './converse-plugins/marshaJoinDiscussionPlugin';
import { nicknameManagementPlugin } from './converse-plugins/nicknameManagementPlugin';
import { participantsTrackingPlugin } from './converse-plugins/participantsTrackingPlugin';

jest.mock('utils/window', () => ({
  converse: {
    initialize: jest.fn(),
    insertInto: jest.fn(),
    logout: jest.fn(),
    plugins: {
      add: jest.fn(),
    },
  },
}));

const mockVideo = videoMockFactory();
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    video: mockVideo,
  }),
}));

jest.mock('utils/chat/chat', () => ({
  generateAnonymousNickname: jest.fn(),
}));

const mockGenerateAnonymousNickname =
  generateAnonymousNickname as jest.MockedFunction<
    typeof generateAnonymousNickname
  >;

describe('initConverse', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initializes once converse.js', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          user: {
            username: 'jane_doe',
          },
        }) as any,
    });
    document.body.innerHTML = '<div id="converse-container"></div>';
    mockGenerateAnonymousNickname.mockReturnValue('Anonymous-generated_id');

    const video = videoMockFactory();
    const xmpp = {
      bosh_url: 'https://xmpp-server.com/http-bind',
      converse_persistent_store: PersistentStore.LOCALSTORAGE,
      websocket_url: 'wss://xmpp-server.com/xmpp-websocket',
      conference_url:
        '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
      prebind_url: 'https://xmpp-server.com/http-pre-bind',
      jid: 'xmpp-server.com',
    };

    // The converse mounter is initialized and converse has not been initialized nor inserted.
    expect(mockWindow.converse.initialize).not.toHaveBeenCalled();
    expect(mockWindow.converse.plugins.add).not.toHaveBeenCalled();

    // first call, converse is initialized
    const initConverse = converseMounter();
    initConverse(xmpp, video);

    expect(mockWindow.converse.initialize).toHaveBeenCalledTimes(1);
    expect(mockWindow.converse.initialize).toHaveBeenCalledWith({
      authentication: 'anonymous',
      auto_login: true,
      auto_join_rooms: [
        '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
      ],
      bosh_service_url: 'https://xmpp-server.com/http-bind',
      clear_cache_on_logout: true,
      discover_connection_methods: false,
      enable_smacks: true,
      idle_presence_timeout: 0,
      i18n: 'en',
      jid: 'xmpp-server.com',
      loglevel: 'error',
      muc_history_max_stanzas: 0,
      muc_instant_rooms: false,
      nickname: 'Anonymous-generated_id',
      persistent_store: 'localStorage',
      ping_interval: 20,
      websocket_url: 'wss://xmpp-server.com/xmpp-websocket',
      whitelisted_plugins: [
        chatPlugin.name,
        logoutPlugin.name,
        marshaJoinDiscussionPlugin.name,
        nicknameManagementPlugin.name,
        participantsTrackingPlugin.name,
      ],
    });
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledTimes(5);
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledWith(
      chatPlugin.name,
      {
        dependencies: ['converse-muc'],
        initialize: expect.any(Function),
      },
    );
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledWith(
      logoutPlugin.name,
      {
        dependencies: ['converse-muc'],
        initialize: expect.any(Function),
      },
    );
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledWith(
      marshaJoinDiscussionPlugin.name,
      {
        dependencies: ['converse-muc'],
        initialize: expect.any(Function),
      },
    );
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledWith(
      nicknameManagementPlugin.name,
      {
        dependencies: ['converse-muc'],
        initialize: expect.any(Function),
      },
    );
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledWith(
      participantsTrackingPlugin.name,
      {
        dependencies: ['converse-muc'],
        initialize: expect.any(Function),
      },
    );
  });
});

describe('converseCleanup', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls converse.logout when converseCleanup is executed', async () => {
    await converseCleanup();

    expect(mockWindow.converse.logout).toHaveBeenCalledTimes(1);
  });

  it('allows to call converse.initialize again once converseCleanup called', async () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          user: {
            username: 'jane_doe',
          },
        }) as any,
    });
    document.body.innerHTML = '<div id="converse-container"></div>';

    const video = videoMockFactory();
    const xmpp = {
      bosh_url: 'https://xmpp-server.com/http-bind',
      converse_persistent_store: PersistentStore.LOCALSTORAGE,
      websocket_url: 'wss://xmpp-server.com/xmpp-websocket',
      conference_url:
        '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
      prebind_url: 'https://xmpp-server.com/http-pre-bind',
      jid: 'xmpp-server.com',
    };

    // The converse mounter is initialized and converse has not been initialized nor inserted.
    expect(mockWindow.converse.initialize).not.toHaveBeenCalled();
    expect(mockWindow.converse.logout).not.toHaveBeenCalled();

    mockGenerateAnonymousNickname.mockReturnValue('Anonymous-generated_id');

    // first call, converse is initialized
    const initConverse = converseMounter();
    initConverse(xmpp, video);

    expect(mockWindow.converse.initialize).toHaveBeenCalledTimes(1);
    expect(mockWindow.converse.initialize).toHaveBeenCalledWith({
      authentication: 'anonymous',
      auto_login: true,
      auto_join_rooms: [
        '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
      ],
      bosh_service_url: 'https://xmpp-server.com/http-bind',
      clear_cache_on_logout: true,
      discover_connection_methods: false,
      enable_smacks: true,
      idle_presence_timeout: 0,
      i18n: 'en',
      jid: 'xmpp-server.com',
      loglevel: 'error',
      muc_history_max_stanzas: 0,
      muc_instant_rooms: false,
      nickname: 'Anonymous-generated_id',
      persistent_store: 'localStorage',
      ping_interval: 20,
      websocket_url: 'wss://xmpp-server.com/xmpp-websocket',
      whitelisted_plugins: [
        chatPlugin.name,
        logoutPlugin.name,
        marshaJoinDiscussionPlugin.name,
        nicknameManagementPlugin.name,
        participantsTrackingPlugin.name,
      ],
    });

    await converseCleanup();

    expect(mockWindow.converse.logout).toHaveBeenCalledTimes(1);

    const otherVideo = videoMockFactory();
    const otherXmpp = {
      bosh_url: 'https://xmpp-server.com/http-bind',
      converse_persistent_store: PersistentStore.LOCALSTORAGE,
      websocket_url: 'wss://xmpp-server.com/xmpp-websocket',
      conference_url: `${otherVideo.id}@conference.xmpp-server.com`,
      prebind_url: 'https://xmpp-server.com/http-pre-bind',
      jid: 'xmpp-server.com',
    };
    mockGenerateAnonymousNickname.mockReturnValue('Anonymous-generated_id_2');

    initConverse(otherXmpp, otherVideo);

    expect(mockWindow.converse.initialize).toHaveBeenCalledTimes(2);
    expect(mockWindow.converse.initialize).toHaveBeenCalledWith({
      authentication: 'anonymous',
      auto_login: true,
      auto_join_rooms: [`${otherVideo.id}@conference.xmpp-server.com`],
      bosh_service_url: 'https://xmpp-server.com/http-bind',
      clear_cache_on_logout: true,
      discover_connection_methods: false,
      enable_smacks: true,
      idle_presence_timeout: 0,
      i18n: 'en',
      jid: 'xmpp-server.com',
      loglevel: 'error',
      muc_history_max_stanzas: 0,
      muc_instant_rooms: false,
      nickname: 'Anonymous-generated_id_2',
      persistent_store: 'localStorage',
      ping_interval: 20,
      websocket_url: 'wss://xmpp-server.com/xmpp-websocket',
      whitelisted_plugins: [
        chatPlugin.name,
        logoutPlugin.name,
        marshaJoinDiscussionPlugin.name,
        nicknameManagementPlugin.name,
        participantsTrackingPlugin.name,
      ],
    });
  });
});
