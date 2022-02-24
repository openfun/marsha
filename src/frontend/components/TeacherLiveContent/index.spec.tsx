import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { LiveModeType } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';

import { TeacherLiveContent } from '.';

jest.mock('components/TeacherLiveRawWrapper', () => () => (
  <span>live raw wrapper</span>
));
jest.mock('components/DashboardVideoLiveJitsi', () => () => (
  <span>video live jitsi</span>
));
jest.mock('components/TeacherLiveStopConfirmation', () => ({
  TeacherLiveStopConfirmation: () => <span>stop confirmation</span>,
}));

let mockStopLiveConfirmation = false;
jest.mock('data/stores/useStopLiveConfirmation', () => ({
  useStopLiveConfirmation: () => [mockStopLiveConfirmation, jest.fn()],
}));

describe('<TeacherLiveContent />', () => {
  beforeEach(() => {
    mockStopLiveConfirmation = false;
  });

  it('renders the raw wrapper', async () => {
    const video = videoMockFactory({ live_type: LiveModeType.RAW });

    const { rerender } = render(
      <Suspense fallback={'loading'}>
        <TeacherLiveContent
          setCanShowStartButton={jest.fn()}
          setCanStartLive={jest.fn()}
          video={video}
        />
      </Suspense>,
    );

    await screen.findByText('live raw wrapper');

    expect(screen.queryByText('stop confirmation')).not.toBeInTheDocument();
    expect(screen.queryByText('video live jitsi')).not.toBeInTheDocument();

    mockStopLiveConfirmation = true;

    rerender(
      <Suspense fallback={'loading'}>
        <TeacherLiveContent
          setCanShowStartButton={jest.fn()}
          setCanStartLive={jest.fn()}
          video={video}
        />
      </Suspense>,
    );

    await screen.findByText('live raw wrapper');
    screen.getByText('stop confirmation');

    expect(screen.queryByText('video live jitsi')).not.toBeInTheDocument();
  });

  it('renders the live jitsi', async () => {
    const video = videoMockFactory({ live_type: LiveModeType.JITSI });

    const { rerender } = render(
      <Suspense fallback={'loading'}>
        <TeacherLiveContent
          setCanShowStartButton={jest.fn()}
          setCanStartLive={jest.fn()}
          video={video}
        />
      </Suspense>,
    );

    await screen.findByText('video live jitsi');

    expect(screen.queryByText('stop confirmation')).not.toBeInTheDocument();
    expect(screen.queryByText('live raw wrapper')).not.toBeInTheDocument();

    mockStopLiveConfirmation = true;

    rerender(
      <Suspense fallback={'loading'}>
        <TeacherLiveContent
          setCanShowStartButton={jest.fn()}
          setCanStartLive={jest.fn()}
          video={video}
        />
      </Suspense>,
    );

    await screen.findByText('video live jitsi');
    screen.getByText('stop confirmation');

    expect(screen.queryByText('live raw wrapper')).not.toBeInTheDocument();
  });
});
