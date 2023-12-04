import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { liveState, useCurrentResourceContext, useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { DashboardControlPane } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<DashboardControlPane />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  it('renders configuration and attendance tabs', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const mockVideo = videoMockFactory({
      id: '5cffe85a-1829-4000-a6ca-a45d4647dc0d',
      live_state: liveState.RUNNING,
    });

    render(
      wrapInVideo(
        <ResponsiveContext.Provider value="large">
          <DashboardControlPane isLive />
        </ResponsiveContext.Provider>,
        mockVideo,
      ),
    );

    expect(
      screen.getByRole('tab', { name: 'configuration' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'attendances' }),
    ).toBeInTheDocument();
  });
});
