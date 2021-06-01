import { render, screen } from '@testing-library/react';
import React from 'react';

import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { LiveModeType } from '../../types/tracks';
import DashboardVideoLiveRaw from '.';

jest.mock('clipboard');

const video = videoMockFactory({
  live_info: {
    medialive: {
      input: {
        endpoints: [
          'rtmp://1.2.3.4:1935/stream-key-primary',
          'rtmp://4.3.2.1:1935/stream-key-secondary',
        ],
      },
    },
  },
  live_type: LiveModeType.RAW,
});

describe('<DashboardVideoLiveRaw>', () => {
  it('displays streaming links', () => {
    render(wrapInIntlProvider(<DashboardVideoLiveRaw video={video} />));

    screen.getByText('rtmp://1.2.3.4:1935');
    screen.getByText('stream-key-primary');
    screen.getByText('rtmp://4.3.2.1:1935');
    screen.getByText('stream-key-secondary');

    screen.getByRole('button', { name: 'copy url rtmp://1.2.3.4:1935' });
    screen.getByRole('button', { name: 'copy key stream-key-primary' });

    screen.getByRole('button', { name: 'copy url rtmp://4.3.2.1:1935' });
    screen.getByRole('button', { name: 'copy key stream-key-secondary' });
  });
});
