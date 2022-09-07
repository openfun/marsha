import { getDefaultNormalizer, screen } from '@testing-library/react';
import React from 'react';

import render from 'utils/tests/render';

import { TeacherLiveInfoBar } from '.';

describe('<TeacherLiveInfoBar />', () => {
  it('renders title and startDate', () => {
    render(
      <TeacherLiveInfoBar title={'title'} startDate={'2022-09-26T07:00:00Z'} />,
    );

    screen.getByRole('heading', { name: 'title' });
    screen.getByText('9/26/2022  ·  7:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });

  it('renders placeholder title when this one is missing', () => {
    render(
      <TeacherLiveInfoBar title={null} startDate={'2022-09-26T07:00:00Z'} />,
    );

    screen.getByRole('heading', { name: 'No title' });
    screen.getByText('9/26/2022  ·  7:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });
});
