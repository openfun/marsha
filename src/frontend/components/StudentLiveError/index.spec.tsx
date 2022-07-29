import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { StudentLiveError } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveErrorBackground: 'path/to/image.png',
      },
    },
  }),
}));

describe('StudentLiveError', () => {
  it('renders with the default message', () => {
    render(wrapInIntlProvider(<StudentLiveError />));

    screen.getByText('Impossible to configure the webinar');
    screen.getByText(
      'We are not able to configure the webinar. You can refresh your browser in few minutes to try to reconnect.',
    );
    const img = screen.getByRole<HTMLImageElement>('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
  });

  it('renders with a custom error message', () => {
    render(
      wrapInIntlProvider(
        <StudentLiveError error="This is a custom error message." />,
      ),
    );

    screen.getByText('Impossible to configure the webinar');
    screen.getByText('This is a custom error message.');
    const img = screen.getByRole<HTMLImageElement>('img');
    expect(img.getAttribute('src')).toEqual('path/to/image.png');
  });
});
