import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsiveContext } from 'grommet';
import { DateTime } from 'luxon';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { DashboardVideoLiveControlPane } from './index';

jest.mock('data/appData', () => ({
  appData: {},
}));

const currentDate = DateTime.fromISO('2022-01-13T12:00');

describe('<DashboardVideoLiveControlPane />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(currentDate.toJSDate());
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  it('renders DashboardVideoLiveControlPane', () => {
    const mockVideo = videoMockFactory({
      title: 'An example title',
      allow_recording: false,
      starting_at: currentDate.toString(),
      estimated_duration: '00:30',
      description: 'An example description',
    });

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

    // DashboardVideoLiveWidgetGeneralTitle
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

    // DashboardVideoLiveWidgetSchedulingAndDescription
    screen.getByText('Description');
    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    expect(inputStartingAtDate).toHaveValue('2022/01/13');
    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    expect(inputStartingAtTime).toHaveValue('12:00');
    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    expect(inputEstimatedDuration).toHaveValue('0:30');
    screen.getByText("Webinar's end");
    screen.getByText('2022/01/13, 12:30');
    const textArea = screen.getByRole('textbox', {
      name: 'Description...',
    });
    expect(textArea).toHaveValue('An example description');
    screen.getByPlaceholderText('Description...');

    // DashboardVideoLiveWidgetLivePairing
    const openButton = screen.getByRole('button', {
      name: 'External broadcast sources',
    });
    userEvent.click(openButton);
    screen.getByRole('button', {
      name: /pair an external device/i,
    });
  });
});
