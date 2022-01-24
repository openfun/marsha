import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { LiveModeType, liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentLiveControlBar } from '.';
import { wrapInRouter } from 'utils/tests/router';

const mockEmptyVideo = videoMockFactory();

describe('<StudentLiveControlBar />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders no button', () => {
    useLivePanelState.setState({});

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockEmptyVideo} />),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders apps wrapper button', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.APPLICATION],
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockEmptyVideo} />),
      ),
    );

    screen.getByRole('button', { name: 'Show apps' });
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders viewers wrapper button', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.VIEWERS_LIST],
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockEmptyVideo} />),
      ),
    );

    screen.getByRole('button', { name: 'Show viewers' });
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders chat wrapper button', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.CHAT],
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockEmptyVideo} />),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Show chat' });
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });
});

describe('<StudentLiveControlBar /> leave/join discussion wrapper', () => {
  it('does not render wrapper without xmpp available in video', () => {
    useLivePanelState.setState({});

    const mockVideo = videoMockFactory({
      live_type: LiveModeType.JITSI,
      live_state: liveState.RUNNING,
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockVideo} />),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('does not render wrapper if video_type is not LiveModeType.JITSI', () => {
    useLivePanelState.setState({});

    const mockVideo = videoMockFactory({
      live_type: LiveModeType.RAW,
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

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockVideo} />),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('does not render wrapper if live_state is missing', () => {
    useLivePanelState.setState({});

    const mockVideo = videoMockFactory({
      live_type: LiveModeType.JITSI,
      live_state: null,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockVideo} />),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('does not render wrapper if live_state is liveState.STOPPING', () => {
    useLivePanelState.setState({});

    const mockVideo = videoMockFactory({
      live_type: LiveModeType.JITSI,
      live_state: liveState.STOPPING,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockVideo} />),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('does not render wrapper if live_state is liveState.PAUSED', () => {
    useLivePanelState.setState({});

    const mockVideo = videoMockFactory({
      live_type: LiveModeType.JITSI,
      live_state: liveState.PAUSED,
      xmpp: {
        bosh_url: 'https://xmpp-server.com/http-bind',
        websocket_url: null,
        conference_url:
          '870c467b-d66e-4949-8ee5-fcf460c72e88@conference.xmpp-server.com',
        prebind_url: 'https://xmpp-server.com/http-pre-bind',
        jid: 'xmpp-server.com',
      },
    });

    render(
      wrapInRouter(
        wrapInIntlProvider(<StudentLiveControlBar video={mockVideo} />),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders leave/join discussion button', () => {
    useLivePanelState.setState({});

    const mockRunningJitsiWithXMPP = videoMockFactory({
      live_type: LiveModeType.JITSI,
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

    render(
      wrapInRouter(
        wrapInIntlProvider(
          <StudentLiveControlBar video={mockRunningJitsiWithXMPP} />,
        ),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Send request to join the discussion' });
  });
});
