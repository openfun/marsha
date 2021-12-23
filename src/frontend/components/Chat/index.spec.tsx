import React from 'react';
import { render } from '@testing-library/react';

import { Chat } from 'components/Chat';
import { liveState } from 'types/tracks';
import { initConverse } from 'utils/conversejs/converse';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

const mockVideo = videoMockFactory({
  id: '5cffe85a-1829-4000-a6ca-a45d4647dc0d',
  live_state: liveState.RUNNING,
  xmpp: {
    bosh_url: 'https://xmpp-server.com/http-bind',
    websocket_url: null,
    conference_url:
      '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
    prebind_url: 'https://xmpp-server.com/http-pre-bind',
    jid: 'xmpp-server.com',
  },
});
jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
  },
}));

jest.mock('utils/conversejs/converse', () => ({
  initConverse: jest.fn(),
}));

describe('<Chat />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the Chat component', () => {
    render(wrapInIntlProvider(<Chat video={mockVideo} />));
    expect(initConverse).toHaveBeenCalledWith(mockVideo.xmpp);
  });
});
