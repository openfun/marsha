import { converseMounter } from './converse';
import * as mockWindow from './window';

import { videoMockFactory } from './tests/factories';

jest.mock('./window', () => ({
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
jest.mock('../data/appData', () => ({
  getDecodedJwt: () => mockDecodedJwtToken,
  appData: {
    video: mockVideo,
  },
}));

describe('converseMounter', () => {
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
      websocket_url: 'wss://xmpp-server.com/xmpp-websocket',
      conference_url:
        '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
      prebind_url: 'https://xmpp-server.com/http-pre-bind',
      jid: 'xmpp-server.com',
    };

    const converseManager = converseMounter();

    // The converse mounter is initialized and converse has not been initialized nor inserted.
    expect(mockWindow.converse.initialize).not.toHaveBeenCalled();
    expect(mockWindow.converse.insertInto).not.toHaveBeenCalled();
    expect(mockWindow.converse.plugins.add).not.toHaveBeenCalled();

    // first call, converse is initialized
    converseManager('#converse-container', xmpp);

    expect(mockWindow.converse.initialize).toHaveBeenCalledTimes(1);
    expect(mockWindow.converse.initialize).toHaveBeenCalledWith({
      allow_contact_requests: false,
      allow_logout: false,
      allow_message_corrections: 'last',
      allow_message_retraction: 'all',
      allow_muc_invitations: false,
      allow_registration: false,
      authentication: 'anonymous',
      auto_login: true,
      auto_join_rooms: [
        '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
      ],
      bosh_service_url: 'https://xmpp-server.com/http-bind',
      clear_cache_on_logout: true,
      discover_connection_methods: false,
      enable_smacks: true,
      hide_muc_participants: true,
      jid: 'xmpp-server.com',
      modtools_disable_assign: true,
      muc_instant_rooms: false,
      muc_show_join_leave: false,
      nickname: 'jane_doe',
      root: expect.any(HTMLDivElement),
      show_client_info: false,
      singleton: true,
      theme: 'concord',
      view_mode: 'embedded',
      visible_toolbar_buttons: {
        call: false,
        emoji: true,
        spoiler: false,
        toggle_occupants: false,
      },
      websocket_url: 'wss://xmpp-server.com/xmpp-websocket',
      whitelisted_plugins: ['marsha', 'marsha-join-discussion'],
    });
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledTimes(2);
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledWith('marsha', {
      dependencies: ['converse-muc'],
      initialize: expect.any(Function),
    });
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledWith(
      'marsha-join-discussion',
      {
        dependencies: ['converse-muc'],
        initialize: expect.any(Function),
      },
    );
    expect(mockWindow.converse.insertInto).not.toHaveBeenCalled();

    // second call, converse is already initialized, we mount it in the dom.
    converseManager('#converse-container', xmpp);

    expect(mockWindow.converse.initialize).toHaveBeenCalledTimes(1);
    expect(mockWindow.converse.insertInto).toHaveBeenCalledTimes(1);
    expect(mockWindow.converse.plugins.add).toHaveBeenCalledTimes(2);
  });
});
