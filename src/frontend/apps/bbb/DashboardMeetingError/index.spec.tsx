import { render } from '@testing-library/react';
import React from 'react';

import { DashboardMeetingError } from '.';
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

describe('<DashboardMeetingError />', () => {
  it('displays the content for 404 not found errors', () => {
    const { getByText } = render(wrapInIntlProvider(<DashboardMeetingError />));
    getByText('The meeting you are looking for could not be found');
    getByText(
      'This meeting does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
    );
  });
});
