import { render } from '@testing-library/react';
import React from 'react';
import { ResponsiveContext } from 'grommet';

import { videoMockFactory } from 'utils/tests/factories';
import { DashboardVideoLiveControlPane } from './index';

const mockVideo = videoMockFactory();

jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
  },
}));

// tests must be added one after another, as the widgets are added
describe('<DashboardVideoLiveControlPane />', () => {
  // since there aren't any widgets for now, we expect DashboardVideoLiveControlPane to be empty
  it('renders DashboardVideoLiveControlPane', () => {
    const { container } = render(
      <ResponsiveContext.Provider value="large">
        <DashboardVideoLiveControlPane video={mockVideo} />
      </ResponsiveContext.Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
