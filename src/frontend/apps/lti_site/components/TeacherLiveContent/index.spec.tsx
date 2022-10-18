import { screen } from '@testing-library/react';
import { videoMockFactory } from 'lib-components';
import React, { Suspense } from 'react';

import { LiveModeType, liveState } from 'lib-components';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { TeacherLiveContent } from '.';

jest.mock('components/TeacherLiveRawWrapper', () => () => (
  <span>live raw wrapper</span>
));
jest.mock('components/DashboardLiveJitsi', () => () => (
  <span>video live jitsi</span>
));

describe('<TeacherLiveContent />', () => {
  it('renders the raw wrapper', async () => {
    const video = videoMockFactory({ live_type: LiveModeType.RAW });

    render(
      wrapInVideo(
        <Suspense fallback={'loading'}>
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
    const video = videoMockFactory({
      live_type: LiveModeType.JITSI,
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
        <Suspense fallback={'loading'}>
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
