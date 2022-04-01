import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { TeacherLiveInfoBar } from '.';

describe('<TeacherLiveInfoBar />', () => {
  it('renders title and startDate', () => {
    render(
      wrapInIntlProvider(
        <TeacherLiveInfoBar title={'title'} startDate={'some date'} />,
      ),
    );

    screen.getByRole('heading', { name: 'title' });
    screen.getByText('some date');
  });

  it('renders placeholder title when this one is missing', () => {
    render(
      wrapInIntlProvider(
        <TeacherLiveInfoBar title={null} startDate={'some date'} />,
      ),
    );

    screen.getByRole('heading', { name: 'No title' });
    screen.getByText('some date');
  });
});
