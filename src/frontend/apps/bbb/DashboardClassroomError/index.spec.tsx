import { render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardClassroomError } from '.';
import { wrapInIntlProvider } from 'utils/tests/intl';

jest.mock('data/appData', () => ({
  appData: {
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  },
}));

describe('<DashboardClassroomError />', () => {
  it('displays the content for 404 not found errors', () => {
    render(wrapInIntlProvider(<DashboardClassroomError />));
    screen.getByText('The classroom you are looking for could not be found');
    screen.getByText(
      'This classroom does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });
});
