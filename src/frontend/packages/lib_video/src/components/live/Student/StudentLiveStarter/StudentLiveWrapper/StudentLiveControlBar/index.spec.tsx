import { cleanup, screen } from '@testing-library/react';
import {
  liveMockFactory,
  JoinMode,
  LiveModeType,
  liveState,
  PersistentStore,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import {
  LivePanelItem,
  useLivePanelState,
} from '@lib-video/hooks/useLivePanelState';
import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { StudentLiveControlBar } from '.';

const mockEmptyVideo = liveMockFactory({
  live_state: liveState.IDLE,
  live_type: LiveModeType.JITSI,
});

jest.mock('hooks/useSetDisplayName', () => ({
  useSetDisplayName: () => [false, jest.fn()],
}));

describe('<StudentLiveControlBar />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders no button', () => {
    useLivePanelState.setState({});

    render(wrapInVideo(<StudentLiveControlBar />, mockEmptyVideo));

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

  it('renders apps wrapper button in mobile view', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.APPLICATION],
    });

    render(wrapInVideo(<StudentLiveControlBar />, mockEmptyVideo), {
      grommetOptions: {
        responsiveSize: 'small',
      },
    });

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

  it('renders viewers wrapper button in mobile view', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.VIEWERS_LIST],
    });

    render(wrapInVideo(<StudentLiveControlBar />, mockEmptyVideo), {
      grommetOptions: {
        responsiveSize: 'small',
      },
    });

    expect(
      screen.queryByRole('button', {
        name: 'Send request to join the discussion',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders chat wrapper button in mobile view', () => {
    useLivePanelState.setState({
      availableItems: [LivePanelItem.CHAT],
    });

    render(wrapInVideo(<StudentLiveControlBar />, mockEmptyVideo), {
      grommetOptions: {
        responsiveSize: 'small',
      },
    });

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
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

    const mockVideo = liveMockFactory({
      live_state: liveState.RUNNING,
    });

    render(wrapInVideo(<StudentLiveControlBar />, mockVideo));

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

    const mockVideo = liveMockFactory({
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

    render(wrapInVideo(<StudentLiveControlBar />, mockVideo));

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
    const { RUNNING: _running, ENDED: _ended, ...state } = liveState;
    const values = Object.values(state);

    values.forEach((myLiveState) => {
      useLivePanelState.setState({});

      const mockVideo = liveMockFactory({
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

      render(wrapInVideo(<StudentLiveControlBar />, mockVideo));

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

    const mockVideo = liveMockFactory({
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

    render(wrapInVideo(<StudentLiveControlBar />, mockVideo));

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

    const mockRunningJitsiWithXMPP = liveMockFactory({
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

    render(wrapInVideo(<StudentLiveControlBar />, mockRunningJitsiWithXMPP));

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', { name: 'Send request to join the discussion' });
  });

  it('renders only leave/join discussion button when in large view', () => {
    useLivePanelState.setState({
      availableItems: [
        LivePanelItem.CHAT,
        LivePanelItem.APPLICATION,
        LivePanelItem.VIEWERS_LIST,
      ],
    });

    const mockRunningJitsiWithXMPP = liveMockFactory({
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

    render(wrapInVideo(<StudentLiveControlBar />, mockRunningJitsiWithXMPP));

    expect(
      screen.queryByRole('button', { name: 'Show apps' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show chat' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show viewers' }),
    ).not.toBeInTheDocument();
    screen.getByRole('button', {
      name: 'Send request to join the discussion',
    });
  });
});
