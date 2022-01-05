import { render, screen } from '@testing-library/react';
import { useParticipantWorkflow } from 'data/stores/useParticipantWorkflow';
import { Grommet } from 'grommet';
import React from 'react';

import { LiveModeType, liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { imageSnapshot } from 'utils/tests/imageSnapshot';
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
  initConverse: jest.fn(() => jest.fn()),
}));

const mockExecuteCommand = jest.fn();
const mockJitsi = jest.fn().mockImplementation(() => ({
  executeCommand: mockExecuteCommand,
  addListener: jest.fn(),
}));

describe('<PublicVideoLiveJitsi />', () => {
  beforeAll(() => {
    global.JitsiMeetExternalAPI = mockJitsi;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('renders jitsi, live info, chat and actions', async () => {
    useParticipantWorkflow.setState({
      accepted: true,
    });

    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet theme={theme} style={{ height: '100%' }}>
            <PublicVideoLiveJitsi video={mockVideo} />
            <GlobalStyles />
          </Grommet>,
        ),
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();

    //  expect chat input to be present
    screen.getByText('Join the chat');

    //  expect live title to be present
    screen.getByRole('heading', { name: 'live title' });

    //  expect buttons to be present
    screen.getByRole('button', {
      name: /Leave discussion/i,
    });
    screen.getByRole('button', {
      name: /Chat/i,
    });

    await imageSnapshot(1920, 1080);
  });
});
