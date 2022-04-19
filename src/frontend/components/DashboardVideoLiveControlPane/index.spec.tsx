import { render, screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveControlPane } from './index';

const mockVideo = videoMockFactory({
  title: 'An example title',
  allow_recording: false,
});

jest.mock('data/appData', () => ({
  appData: {
    video: mockVideo,
  },
}));

// tests must be added one after another, as the widgets are added
describe('<DashboardVideoLiveControlPane />', () => {
  // since there aren't any widgets for now, we expect DashboardVideoLiveControlPane to be empty
  it('renders DashboardVideoLiveControlPane', () => {
    const queryClient = new QueryClient();

    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <ResponsiveContext.Provider value="large">
            <DashboardVideoLiveControlPane video={mockVideo} />
          </ResponsiveContext.Provider>
        </QueryClientProvider>,
      ),
    );

    // DashboardVideoLiveGeneralTitle
    screen.getByText('General');
    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your live here',
    });
    expect(textInput).toHaveValue('An example title');
    const toggleButton = screen.getByRole('checkbox', {
      name: 'Activate live recording',
    });
    expect(toggleButton).not.toBeChecked();
    screen.getByText('Activate live recording');
  });
});
