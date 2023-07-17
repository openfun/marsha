import { screen } from '@testing-library/react';
import { LiveModeType, liveState, videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import DashboardLiveRaw from '.';

describe('<DashboardLiveRaw>', () => {
  it('renders advice to start the stream', () => {
    const video = videoMockFactory({
      live_type: LiveModeType.RAW,
      live_state: liveState.IDLE,
    });

    render(<DashboardLiveRaw video={video} />);

    screen.getByText(
      'You are about to start a live using an external source provider.',
    );
    screen.getByText(
      'Start the live to access stream enpoint and configure your external tool with it.',
    );

    expect(screen.queryByText('rtmp://1.2.3.4:1935')).not.toBeInTheDocument();
    expect(screen.queryByText('stream-key-primary')).not.toBeInTheDocument();
    expect(screen.queryByText('rtmp://4.3.2.1:1935')).not.toBeInTheDocument();
    expect(screen.queryByText('stream-key-secondary')).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'copy url rtmp://1.2.3.4:1935' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'copy key stream-key-primary' }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'copy url rtmp://4.3.2.1:1935' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'copy key stream-key-secondary' }),
    ).not.toBeInTheDocument();
  });

  it('displays streaming links', () => {
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
      live_state: liveState.RUNNING,
    });

    render(<DashboardLiveRaw video={video} />);

    expect(
      screen.queryByText(
        'You are about to start a live using an external source provider.',
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'Start the live to access stream enpoint and configure your external tool with it.',
      ),
    ).not.toBeInTheDocument();

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
