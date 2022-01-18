import { render, screen } from '@testing-library/react';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { Grommet, ResponsiveContext } from 'grommet';
import React from 'react';

import { LiveModeType, liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { wrapInRouter } from 'utils/tests/router';
import { GlobalStyles } from 'utils/theme/baseStyles';
import { theme } from 'utils/theme/theme';

import PublicVideoLiveJitsi from '.';

const mockVideo = videoMockFactory({
  title: 'live title',
  live_info: {
    jitsi: {
      domain: 'meet.jit.si',
      external_api_url: 'https://meet.jit.si/external_api.js',
      config_overwrite: {},
      interface_config_overwrite: {},
    },
  },
  live_state: liveState.IDLE,
  live_type: LiveModeType.JITSI,
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
  getDecodedJwt: () => ({
    user: {
      username: 'jane_doe',
    },
  }),
  appData: {
    video: mockVideo,
  },
}));

jest.mock('utils/conversejs/converse', () => ({
  converseMounter: jest.fn(() => jest.fn()),
}));

const mockExecuteCommand = jest.fn();
const mockJitsi = jest.fn().mockImplementation(() => ({
  executeCommand: mockExecuteCommand,
  addListener: jest.fn(),
}));

window.HTMLElement.prototype.scrollTo = jest.fn();

describe('<PublicVideoLiveJitsi />', () => {
  beforeAll(() => {
    global.JitsiMeetExternalAPI = mockJitsi;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('renders jitsi, live info, chat and actions on large screen', async () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet theme={theme} style={{ height: '100%' }}>
            <ResponsiveContext.Provider value="large">
              <PublicVideoLiveJitsi video={mockVideo} />
              <GlobalStyles />
            </ResponsiveContext.Provider>
          </Grommet>,
        ),
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();

    //  expect chat input to not be present
    expect(screen.queryByText('Join the chat')).not.toBeInTheDocument();

    //  expect live title to be present
    screen.getByRole('heading', { name: 'live title' });

    //  expect buttons to be present
    screen.getByRole('button', {
      name: /Leave discussion/i,
    });
    screen.getByRole('button', {
      name: /Show chat/i,
    });
  });

  it('renders jitsi, live info, chat and actions on small screen', () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet theme={theme} style={{ height: '100%' }}>
            <ResponsiveContext.Provider value="small">
              <PublicVideoLiveJitsi video={mockVideo} />
              <GlobalStyles />
            </ResponsiveContext.Provider>
          </Grommet>,
        ),
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();

    //  expect chat input to be present (because live panel will contain at least the chat)
    //  but not visible (because live panel state is configured by default not to show the panel)
    //  for now, live panel is not unmounted when we don't want to display it because of chat issues
    expect(screen.getByText('Join the chat')).not.toBeVisible();

    //  expect live title to be present
    screen.getByRole('heading', { name: 'live title' });

    //  expect buttons to be present
    screen.getByRole('button', {
      name: /Leave discussion/i,
    });
    screen.getByRole('button', {
      name: /Show chat/i,
    });
  });
});
