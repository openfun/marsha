import { screen } from '@testing-library/react';
import {
  PersistentStore,
  liveState,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { Chat } from '.';

jest.mock('hooks/useSetDisplayName', () => ({
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

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
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
    render(<Chat isModerated={false} />);

    expect(
      screen.getByRole('button', { name: 'Join the chat' }),
    ).toBeInTheDocument();
  });

  it('renders the Chat component in moderated mode', () => {
    render(<Chat isModerated />);

    expect(
      screen.queryByRole('button', { name: 'Join the chat' }),
    ).not.toBeInTheDocument();
  });

  it('renders the Chat component as standalone', () => {
    render(<Chat standalone isModerated={false} />);

    expect(
      screen.getByRole('button', { name: 'Join the chat' }),
    ).toBeInTheDocument();
  });
});
