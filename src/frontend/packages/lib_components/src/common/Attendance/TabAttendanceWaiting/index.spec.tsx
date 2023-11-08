import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { TabAttendanceWaiting } from '.';

jest.mock('@lib-components/data/stores/useAppConfig', () => ({
  ...jest.requireActual('@lib-components/data/stores/useAppConfig'),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
}));

describe('<DashboardLiveTabAttendanceWaiting />', () => {
  it('displays the webinar message', async () => {
    render(<TabAttendanceWaiting type="webinar" />);

    expect(
      await screen.findByText('The webinar has no participant yet'),
    ).toBeInTheDocument();
  });

  it('displays the classroom message', async () => {
    render(<TabAttendanceWaiting type="classroom" />);

    expect(
      await screen.findByText('The classroom has no participant yet'),
    ).toBeInTheDocument();
  });
});
