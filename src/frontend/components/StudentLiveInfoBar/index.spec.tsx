import { getDefaultNormalizer, screen } from '@testing-library/react';
import React from 'react';

import { imageSnapshot } from 'utils/tests/imageSnapshot';
import render from 'utils/tests/render';

import { StudentLiveInfoBar } from '.';

describe('<StudentLiveInfoBar />', () => {
  it('renders live title', () => {
    render(<StudentLiveInfoBar title="title" startDate={null} />);

    screen.getByText('title');
  });

  it('renders live title and live start datetime [screenshot]', async () => {
    render(
      <StudentLiveInfoBar title={'title'} startDate={'2022-09-26T07:00:00Z'} />,
    );

    screen.getByText('title');
    screen.getByText('9/26/2022  ·  7:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });

    await imageSnapshot();
  });
});
