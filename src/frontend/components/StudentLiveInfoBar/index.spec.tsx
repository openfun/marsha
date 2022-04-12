import { render, screen } from '@testing-library/react';
import React from 'react';
import { imageSnapshot } from 'utils/tests/imageSnapshot';

import { StudentLiveInfoBar } from '.';

describe('<StudentLiveInfoBar />', () => {
  it('renders live title', () => {
    render(<StudentLiveInfoBar title="title" startDate={null} />);

    screen.getByText('title');
  });

  it('renders live title and live start datetime', async () => {
    render(
      <StudentLiveInfoBar title="title" startDate="2021/12/12 14:00:00" />,
    );

    screen.getByText('title');
    screen.getByText('2021/12/12 14:00:00');

    await imageSnapshot();
  });
});
