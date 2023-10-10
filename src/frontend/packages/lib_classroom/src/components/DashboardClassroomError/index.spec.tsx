import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { DashboardClassroomError } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  }),
}));

describe('<DashboardClassroomError />', () => {
  it('displays the content for 404 not found errors', () => {
    render(<DashboardClassroomError />);
    expect(
      screen.getByText('The classroom you are looking for could not be found'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This classroom does not exist or has not been published yet. If you are an instructor, please make sure you are properly authenticated.',
      ),
    ).toBeInTheDocument();
  });

  it('displays the message error', () => {
    render(<DashboardClassroomError message="my message error" />);
    expect(screen.getByText('my message error')).toBeInTheDocument();
  });
});
