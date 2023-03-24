import { screen } from '@testing-library/react';
import { liveMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { StudentLiveDescription } from '.';

describe('<StudentLiveDescription />', () => {
  it('renders live title and description', () => {
    const video = liveMockFactory({
      title: 'live title',
      description: 'live description',
    });

    render(wrapInVideo(<StudentLiveDescription />, video));

    expect(
      screen.getByRole('heading', { name: 'live title' }),
    ).toBeInTheDocument();
    expect(screen.getByText('live description')).toBeInTheDocument();
  });

  it('renders default live title if none is set', () => {
    const video = liveMockFactory({
      title: undefined,
      description: 'live description',
    });

    render(wrapInVideo(<StudentLiveDescription />, video));

    expect(
      screen.getByRole('heading', { name: 'This live has no title yet.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('live description')).toBeInTheDocument();
  });

  it('check renders title and description when scheduled passed', () => {
    const video = liveMockFactory({
      title: undefined,
      description: 'live description',
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
