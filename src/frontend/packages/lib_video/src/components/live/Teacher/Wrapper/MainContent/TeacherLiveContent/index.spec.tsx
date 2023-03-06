import { screen } from '@testing-library/react';
import { LiveModeType, liveState, liveMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React, { Suspense } from 'react';

import { wrapInVideo } from 'utils/wrapInVideo';

import { TeacherLiveContent } from '.';

jest.mock('./TeacherLiveRawWrapper', () => () => <span>live raw wrapper</span>);
jest.mock('components/live/common/DashboardLiveJitsi', () => () => (
  <span>video live jitsi</span>
));

describe('<TeacherLiveContent />', () => {
  it('renders the raw wrapper', async () => {
    const video = liveMockFactory({
      live_state: liveState.IDLE,
      live_type: LiveModeType.RAW,
    });

    render(
      wrapInVideo(
        <Suspense fallback="loading">
          <TeacherLiveContent
            setCanShowStartButton={jest.fn()}
            setCanStartLive={jest.fn()}
          />
        </Suspense>,
        video,
      ),
    );

    await screen.findByText('live raw wrapper');

    expect(screen.queryByText('video live jitsi')).not.toBeInTheDocument();
  });

  it('renders the live jitsi', async () => {
    const video = liveMockFactory({
      live_state: liveState.RUNNING,
      live_info: {
        jitsi: {
          external_api_url: 'some.external.api',
          domain: 'some.domain',
          config_overwrite: {},
          interface_config_overwrite: {},
          room_name: 'some-room-name',
        },
      },
    });

    render(
      wrapInVideo(
        <Suspense fallback="loading">
          <TeacherLiveContent
            setCanShowStartButton={jest.fn()}
            setCanStartLive={jest.fn()}
          />
        </Suspense>,
        video,
      ),
    );

    await screen.findByText('video live jitsi');

    expect(screen.queryByText('live raw wrapper')).not.toBeInTheDocument();
  });
});
