import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';

import {
  LivePanelItem,
  useLivePanelState,
} from 'data/stores/useLivePanelState';
import { JoinMode, LiveModeType, liveState } from 'types/tracks';
import { PersistentStore } from 'types/XMPP';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';

import { StudentLiveControlBar } from '.';

const mockEmptyVideo = videoMockFactory();

jest.mock('data/stores/useSetDisplayName', () => ({
  useSetDisplayName: () => [false, jest.fn()],
}));

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
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
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
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
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

  it('does not render wrapper if live_state is not liveState.RUNNING', () => {
    const values = Object.values(liveState).filter(
      (state) => state !== liveState.RUNNING,
    );

    values.forEach((myLiveState) => {
      useLivePanelState.setState({});

      const mockVideo = videoMockFactory({
        live_type: LiveModeType.JITSI,
        live_state: myLiveState,
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

      cleanup();
    });
  });

  it('does not render wrapper if join_mode is not JoinMode.ASK_FOR_APPROVAL', () => {
    useLivePanelState.setState({});

    const mockVideo = videoMockFactory({
      join_mode: JoinMode.DENIED,
      live_type: LiveModeType.JITSI,
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
        converse_persistent_store: PersistentStore.LOCALSTORAGE,
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
