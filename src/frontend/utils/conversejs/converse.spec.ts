import { PersistentStore } from 'types/XMPP';
import { videoMockFactory } from 'utils/tests/factories';
import * as mockWindow from 'utils/window';

import { converseMounter } from './converse';
import { chatPlugin } from './converse-plugins/chatPlugin';
import { logoutPlugin } from './converse-plugins/logoutPlugin';
import { marshaJoinDiscussionPlugin } from './converse-plugins/marshaJoinDiscussionPlugin';
import { nicknameManagementPlugin } from './converse-plugins/nicknameManagementPlugin';
import { participantsTrackingPlugin } from './converse-plugins/participantsTrackingPlugin';

jest.mock('utils/window', () => ({
  converse: {
    initialize: jest.fn(),
    insertInto: jest.fn(),
    plugins: {
      add: jest.fn(),
    },
  },
}));
let mockDecodedJwtToken = {};
const mockVideo = videoMockFactory();
jest.mock('data/appData', () => ({
  getDecodedJwt: () => mockDecodedJwtToken,
  appData: {
    video: mockVideo,
  },
}));

jest.mock('utils/chat/chat', () => ({
  generateAnonymousNickname: jest
    .fn()
    .mockReturnValue('Anonymous-generated_id'),
}));

describe('initConverse', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initializes once converse.js', () => {
    mockDecodedJwtToken = {
      user: {
        username: 'jane_doe',
      },
    };
    document.body.innerHTML = '<div id="converse-container"></div>';

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
    initConverse(xmpp);

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
