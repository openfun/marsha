import { render, screen } from '@testing-library/react';
import React from 'react';

import { videoMockFactory } from 'utils/tests/factories';
import { StudentLiveDescription } from '.';

describe('<StudentLiveDescription />', () => {
  it('renders live title and description', () => {
    const video = videoMockFactory({
      title: 'live title',
      description: 'live description',
    });

    render(<StudentLiveDescription video={video} />);

    screen.getByText('live title');
    screen.getByText('live description');
  });
});
