import { render, screen } from '@testing-library/react';
import { LiveModaleProps } from 'components/LiveModale';
import React, { Fragment, Suspense } from 'react';

import { LiveModeType, liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInRouter } from 'utils/tests/router';
import { Nullable } from 'utils/types';

import { TeacherLiveContent } from '.';

jest.mock('components/TeacherLiveRawWrapper', () => () => (
  <span>live raw wrapper</span>
));
jest.mock('components/DashboardVideoLiveJitsi', () => () => (
  <span>video live jitsi</span>
));
jest.mock('components/LiveModale', () => ({
  LiveModale: () => <span>stop confirmation</span>,
}));

let mockLiveModaleConfiguration: Nullable<LiveModaleProps>;
jest.mock('data/stores/useLiveModale', () => ({
  useLiveModaleConfiguration: () => [mockLiveModaleConfiguration, jest.fn()],
}));

describe('<TeacherLiveContent />', () => {
  beforeEach(() => {
    mockLiveModaleConfiguration = null;
  });

  it('renders the raw wrapper', async () => {
    const video = videoMockFactory({ live_type: LiveModeType.RAW });

    const { rerender } = render(
      wrapInRouter(
        <Suspense fallback={'loading'}>
          <TeacherLiveContent
            setCanShowStartButton={jest.fn()}
            setCanStartLive={jest.fn()}
            video={video}
          />
        </Suspense>,
      ),
    );

    await screen.findByText('live raw wrapper');

    expect(screen.queryByText('stop confirmation')).not.toBeInTheDocument();
    expect(screen.queryByText('video live jitsi')).not.toBeInTheDocument();

    mockLiveModaleConfiguration = {
      content: <Fragment></Fragment>,
      actions: [],
    };

    rerender(
      wrapInRouter(
        <Suspense fallback={'loading'}>
          <TeacherLiveContent
            setCanShowStartButton={jest.fn()}
            setCanStartLive={jest.fn()}
            video={video}
          />
        </Suspense>,
      ),
    );

    await screen.findByText('live raw wrapper');
    screen.getByText('stop confirmation');

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

    const { rerender } = render(
      wrapInRouter(
        <Suspense fallback={'loading'}>
          <TeacherLiveContent
            setCanShowStartButton={jest.fn()}
            setCanStartLive={jest.fn()}
            video={video}
          />
        </Suspense>,
      ),
    );

    await screen.findByText('video live jitsi');

    expect(screen.queryByText('stop confirmation')).not.toBeInTheDocument();
    expect(screen.queryByText('live raw wrapper')).not.toBeInTheDocument();

    mockLiveModaleConfiguration = {
      content: <Fragment></Fragment>,
      actions: [],
    };

    rerender(
      wrapInRouter(
        <Suspense fallback={'loading'}>
          <TeacherLiveContent
            setCanShowStartButton={jest.fn()}
            setCanStartLive={jest.fn()}
            video={video}
          />
        </Suspense>,
      ),
    );

    await screen.findByText('video live jitsi');
    screen.getByText('stop confirmation');

    expect(screen.queryByText('live raw wrapper')).not.toBeInTheDocument();
  });
});
