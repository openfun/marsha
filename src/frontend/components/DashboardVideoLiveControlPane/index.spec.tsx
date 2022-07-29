import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { liveState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { DashboardVideoLiveControlPane } from '.';

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    static: {
      img: {
        liveBackground: 'some_url',
      },
    },
  }),
}));

describe('<DashboardVideoLiveControlPane />', () => {
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
          <DashboardVideoLiveControlPane />
        </ResponsiveContext.Provider>,
        mockVideo,
      ),
    );

    screen.getByRole('tab', { name: 'configuration' });
    screen.getByRole('tab', { name: 'attendances' });
  });
});
