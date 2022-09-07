import React from 'react';
import { screen } from '@testing-library/react';

import { Chat } from 'components/Chat';
import { useJwt } from 'data/stores/useJwt';
import { liveState } from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

jest.mock('data/stores/useSetDisplayName', () => ({
  useSetDisplayName: () => [false, jest.fn()],
}));

const mockVideo = videoMockFactory({
  id: '5cffe85a-1829-4000-a6ca-a45d4647dc0d',
  live_state: liveState.RUNNING,
  xmpp: {
    bosh_url: 'https://xmpp-server.com/http-bind',
    converse_persistent_store: PersistentStore.LOCALSTORAGE,
    websocket_url: null,
    conference_url:
      '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
    prebind_url: 'https://xmpp-server.com/http-pre-bind',
    jid: 'xmpp-server.com',
  },
});

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    video: mockVideo,
  }),
}));

describe('<Chat />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: jest.fn(),
    });
  });

  it('renders the Chat component', () => {
    render(<Chat />);

    screen.getByRole('button', { name: 'Join the chat' });
  });

  it('renders the Chat component as standalone', () => {
    render(<Chat standalone />);

    screen.getByRole('button', { name: 'Join the chat' });
  });
});
