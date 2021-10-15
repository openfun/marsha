import { render, screen } from '@testing-library/react';
import React from 'react';

import { LiveModeType, liveState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import PublicVideoLiveJitsi from '.';

const mockVideo = videoMockFactory({
  live_info: {
    jitsi: {
      domain: 'meet.jit.si',
      external_api_url: 'https://meet.jit.si/external_api.js',
      config_overwrite: {},
      interface_config_overwrite: {},
    },
  },
  live_state: liveState.CREATING,
  live_type: LiveModeType.JITSI,
});

jest.mock('../../data/appData', () => ({
  getDecodedJwt: () => ({
    user: {
      username: 'jane_doe',
    },
  }),
  appData: {
    video: mockVideo,
  },
}));

const mockExecuteCommand = jest.fn();
const mockJitsi = jest.fn().mockImplementation(() => ({
  executeCommand: mockExecuteCommand,
  addListener: jest.fn(),
}));

describe('<PublicVideoLiveJitsi />', () => {
  it('renders jitsi and the leave button', () => {
    global.JitsiMeetExternalAPI = mockJitsi;
    render(
      wrapInRouter(
        wrapInIntlProvider(<PublicVideoLiveJitsi video={mockVideo} />),
      ),
    );

    expect(mockJitsi).toHaveBeenCalled();
    screen.getByRole('button', { name: 'Leave the discussion' });
  });
});
