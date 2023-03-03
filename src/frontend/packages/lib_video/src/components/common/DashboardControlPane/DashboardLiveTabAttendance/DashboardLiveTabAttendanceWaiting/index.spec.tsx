import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { DashboardLiveTabAttendanceWaiting } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
  report: jest.fn(),
}));

describe('<DashboardLiveTabAttendanceWaiting />', () => {
  it('displays the default message when there is no attendance', async () => {
    render(<DashboardLiveTabAttendanceWaiting />);

    expect(
      await screen.findByText('The live has no participant yet'),
    ).toBeInTheDocument();
  });
});
