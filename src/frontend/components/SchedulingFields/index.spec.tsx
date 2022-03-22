import { fireEvent, render, screen } from '@testing-library/react';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { SchedulingFields } from './index';

Settings.defaultLocale = 'en';
Settings.defaultZone = 'utc';

describe('<SchedulingFields />', () => {
  it('triggers callbacks when updating fields', () => {
    const queryClient = new QueryClient();
    const onStartingAtChange = jest.fn();
    const onEstimatedDurationChange = jest.fn();
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <SchedulingFields
            startingAt={null}
            estimatedDuration={null}
            onStartingAtChange={onStartingAtChange}
            onEstimatedDurationChange={onEstimatedDurationChange}
          />
        </QueryClientProvider>,
      ),
    );

    const startingAt = DateTime.local()
      .plus({ days: 1 })
      .set({ second: 0, millisecond: 0 });
    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    fireEvent.change(inputStartingAtDate, {
      target: { value: startingAt.toFormat('yyyy/MM/dd') },
    });
    expect(onStartingAtChange).toHaveBeenCalledWith(
      startingAt.set({ hour: 0, minute: 0, second: 0 }).toISO(),
    );

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAt.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    expect(onStartingAtChange).toHaveBeenCalledWith(startingAt.toISO());

    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    fireEvent.change(inputEstimatedDuration, {
      target: { value: estimatedDuration.toFormat('h:mm') },
    });

    screen.getByDisplayValue(estimatedDuration.toFormat('h:mm'));
    expect(onEstimatedDurationChange).toHaveBeenCalledWith(
      estimatedDuration.toFormat('hh:mm:ss'),
    );
  });

  it('formats starting date and time', () => {
    const queryClient = new QueryClient();
    const startingAt = DateTime.local(2022, 1, 27, 14, 22, 15);
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <SchedulingFields
            startingAt={startingAt.toISO()}
            estimatedDuration={null}
          />
        </QueryClientProvider>,
      ),
    );
    screen.getByDisplayValue(startingAt.toFormat('yyyy/MM/dd'));
    screen.getByDisplayValue(
      startingAt.toLocaleString(DateTime.TIME_24_SIMPLE),
    );
  });

  it('formats estimated duration', () => {
    const queryClient = new QueryClient();
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <SchedulingFields
            startingAt={null}
            estimatedDuration={estimatedDuration.toFormat('hh:mm:ss')}
          />
        </QueryClientProvider>,
      ),
    );
    screen.getByDisplayValue(estimatedDuration.toFormat('h:mm'));
  });
});
