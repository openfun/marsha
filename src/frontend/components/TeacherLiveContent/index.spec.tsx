import { screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { LiveModeType, liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { TeacherLiveContent } from '.';

jest.mock('components/TeacherLiveRawWrapper', () => () => (
  <span>live raw wrapper</span>
));
jest.mock('components/DashboardVideoLiveJitsi', () => () => (
  <span>video live jitsi</span>
));

describe('<TeacherLiveContent />', () => {
  it('renders the raw wrapper', async () => {
    const video = videoMockFactory({ live_type: LiveModeType.RAW });

    render(
      <Suspense fallback={'loading'}>
        <TeacherLiveContent
          setCanShowStartButton={jest.fn()}
          setCanStartLive={jest.fn()}
          video={video}
        />
      </Suspense>,
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
      <Suspense fallback={'loading'}>
        <TeacherLiveContent
          setCanShowStartButton={jest.fn()}
          setCanStartLive={jest.fn()}
          video={video}
        />
      </Suspense>,
    );

    await screen.findByText('video live jitsi');

    expect(screen.queryByText('live raw wrapper')).not.toBeInTheDocument();
  });
});
