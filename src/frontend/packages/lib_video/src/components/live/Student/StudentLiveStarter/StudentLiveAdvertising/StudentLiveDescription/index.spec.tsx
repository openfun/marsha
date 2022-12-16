import { screen } from '@testing-library/react';
import { videoMockFactory, liveState, LiveModeType } from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import { wrapInVideo } from 'utils/wrapInVideo';

import { StudentLiveDescription } from '.';

describe('<StudentLiveDescription />', () => {
  it('renders live title and description', () => {
    const video = videoMockFactory({
      title: 'live title',
      description: 'live description',
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });

    render(wrapInVideo(<StudentLiveDescription />, video));

    expect(
      screen.getByRole('heading', { name: 'live title' }),
    ).toBeInTheDocument();
    expect(screen.getByText('live description')).toBeInTheDocument();
  });

  it('renders default live title if none is set', () => {
    const video = videoMockFactory({
      title: undefined,
      description: 'live description',
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });

    render(wrapInVideo(<StudentLiveDescription />, video));

    expect(
      screen.getByRole('heading', { name: 'This live has no title yet.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('live description')).toBeInTheDocument();
  });

  it('check renders title and description when scheduled passed', () => {
    const video = videoMockFactory({
      title: undefined,
      description: 'live description',
      live_state: liveState.IDLE,
      live_type: LiveModeType.JITSI,
    });

    render(
      wrapInVideo(
        <StudentLiveDescription
          startDate={DateTime.utc(2017, 5, 15, 17, 36)}
        />,
        video,
      ),
    );

    expect(screen.getByRole('heading', { name: '' })).toBeInTheDocument();
    expect(screen.getByText('live description')).toBeInTheDocument();
  });
});
