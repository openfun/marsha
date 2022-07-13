import { screen } from '@testing-library/react';
import React from 'react';

import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { StudentLiveDescription } from '.';

describe('<StudentLiveDescription />', () => {
  it('renders live title and description', () => {
    const video = videoMockFactory({
      title: 'live title',
      description: 'live description',
      live_state: liveState.IDLE,
    });

    render(wrapInVideo(<StudentLiveDescription />, video));

    screen.getByRole('heading', { name: 'live title' });
    screen.getByText('live description');
  });

  it('renders default live title if none is set', () => {
    const video = videoMockFactory({
      title: undefined,
      description: 'live description',
      live_state: liveState.IDLE,
    });

    render(wrapInVideo(<StudentLiveDescription />, video));

    screen.getByRole('heading', { name: 'This live has no title yet.' });
    screen.getByText('live description');
  });
});
