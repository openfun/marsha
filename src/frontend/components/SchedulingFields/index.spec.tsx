import { fireEvent, render, screen } from '@testing-library/react';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { SchedulingFields } from './index';

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

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

  it('clears inputs', () => {
    const queryClient = new QueryClient();
    const startingAt = DateTime.local(2022, 1, 27, 14, 22);
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const onStartingAtChange = jest.fn();
    const onEstimatedDurationChange = jest.fn();
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <SchedulingFields
            startingAt={startingAt.toISO()}
            estimatedDuration={estimatedDuration.toFormat('hh:mm:ss')}
            onStartingAtChange={onStartingAtChange}
            onEstimatedDurationChange={onEstimatedDurationChange}
          />
        </QueryClientProvider>,
      ),
    );

    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    fireEvent.change(inputStartingAtDate, { target: { value: null } });
    expect(onStartingAtChange).toHaveBeenCalledWith(null);

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, { target: { value: null } });
    expect(onStartingAtChange).toHaveBeenCalledWith(null);

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    fireEvent.change(inputEstimatedDuration, { target: { value: null } });
    expect(onEstimatedDurationChange).toHaveBeenCalledWith(null);
  });

  it('shows error when setting a past start date', () => {
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

    const startingAtPast = DateTime.local().minus({ days: 1 });
    const inputStartingAtDate = screen.getByLabelText(/starting date/i);
    fireEvent.change(inputStartingAtDate, {
      target: { value: startingAtPast.toFormat('yyyy/MM/dd') },
    });

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, {
      target: { value: startingAtPast.toLocaleString(DateTime.TIME_24_SIMPLE) },
    });
    expect(onStartingAtChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        `${startingAtPast.toLocaleString(
          DateTime.DATETIME_MED,
        )} is not valid: Starting date and time should be set in the future.`,
      ),
    ).toBeInTheDocument();

    const startingAtFuture = DateTime.local().plus({ days: 1 });
    fireEvent.change(inputStartingAtDate, {
      target: { value: startingAtFuture.toFormat('yyyy/MM/dd') },
    });
    expect(
      screen.queryByText(
        `${startingAtPast.toLocaleString(
          DateTime.DATETIME_MED,
        )} is not valid: Starting date and time should be set in the future.`,
      ),
    ).not.toBeInTheDocument();
  });
});
