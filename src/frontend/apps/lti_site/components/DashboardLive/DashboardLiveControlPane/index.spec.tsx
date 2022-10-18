import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { useJwt, videoMockFactory } from 'lib-components';
import React from 'react';

import { liveState } from 'types/tracks';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { DashboardLiveControlPane } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
}));

describe('<DashboardLiveControlPane />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  it('renders configuration and attendance tabs', () => {
    const mockVideo = videoMockFactory({
      id: '5cffe85a-1829-4000-a6ca-a45d4647dc0d',
      live_state: liveState.RUNNING,
    });

    render(
      wrapInVideo(
        <ResponsiveContext.Provider value="large">
          <DashboardLiveControlPane />
        </ResponsiveContext.Provider>,
        mockVideo,
      ),
    );

    screen.getByRole('tab', { name: 'configuration' });
    screen.getByRole('tab', { name: 'attendances' });
  });
});
