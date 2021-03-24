import { render } from '@testing-library/react';
import React from 'react';

import { videoMockFactory } from '../../utils/tests/factories';
import * as mockWindow from '../../utils/window';
import { Chat } from '.';

jest.mock('../../utils/window', () => ({
  converse: {
    initialize: jest.fn(),
  },
}));

describe('<Chat />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the Chat component', () => {
    const video = videoMockFactory({
      id: '870c467b-d66e-4949-8ee5-fcf460c72e88',
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(<Chat xmpp={video.xmpp!} />);

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
      discover_connection_methods: false,
      hide_muc_participants: true,
      jid: 'xmpp-server.com',
      modtools_disable_assign: true,
      singleton: true,
      view_mode: 'embedded',
      visible_toolbar_buttons: {
        call: false,
        spoiler: false,
        emoji: true,
        toggle_occupants: false,
      },
    });
  });
});
