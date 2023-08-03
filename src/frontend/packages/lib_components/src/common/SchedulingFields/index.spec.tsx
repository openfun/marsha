import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, userTypeDatePicker } from 'lib-tests';
import { DateTime, Duration, Settings } from 'luxon';
import React from 'react';

import { SchedulingFields } from './index';

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

describe('<SchedulingFields />', () => {
  it('triggers callbacks when updating fields', async () => {
    const onStartingAtChange = jest.fn();
    const onEstimatedDurationChange = jest.fn();

    render(
      <SchedulingFields
        startingAt={null}
        estimatedDuration={null}
        onStartingAtChange={onStartingAtChange}
        onEstimatedDurationChange={onEstimatedDurationChange}
      />,
    );

    const inputStartingAtDate = within(
      screen.getByTestId('starting-at-date-picker'),
    ).getByRole('presentation');
    expect(inputStartingAtDate).toHaveTextContent('mm/dd/yyyy');

    const startingAt = DateTime.local()
      .plus({ days: 1 })
      .set({ second: 0, millisecond: 0 });
    await userTypeDatePicker(startingAt, screen.getByText(/Starting date/i));
    expect(inputStartingAtDate).toHaveTextContent(startingAt.toLocaleString());

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
    const startingAt = DateTime.local(2022, 1, 27, 14, 22, 15);

    render(
      <SchedulingFields
        startingAt={startingAt.toISO()}
        estimatedDuration={null}
      />,
    );

    const inputStartingAtDate = within(
      screen.getByTestId('starting-at-date-picker'),
    ).getByRole('presentation');
    expect(inputStartingAtDate).toHaveTextContent('1/27/2022');
    expect(
      screen.getByDisplayValue(
        startingAt.toLocaleString(DateTime.TIME_24_SIMPLE),
      ),
    ).toBeInTheDocument();
  });

  it('formats estimated duration', () => {
    const estimatedDuration = Duration.fromObject({ minutes: 30 });

    render(
      <SchedulingFields
        startingAt={null}
        estimatedDuration={estimatedDuration.toFormat('hh:mm:ss')}
      />,
    );

    expect(
      screen.getByDisplayValue(estimatedDuration.toFormat('h:mm')),
    ).toBeInTheDocument();
  });

  it('clears inputs', async () => {
    const startingAt = DateTime.local(2022, 1, 27, 14, 22);
    const estimatedDuration = Duration.fromObject({ minutes: 30 });
    const onStartingAtChange = jest.fn();
    const onEstimatedDurationChange = jest.fn();

    render(
      <SchedulingFields
        startingAt={startingAt.toISO()}
        estimatedDuration={estimatedDuration.toFormat('hh:mm:ss')}
        onStartingAtChange={onStartingAtChange}
        onEstimatedDurationChange={onEstimatedDurationChange}
      />,
    );

    const inputStartingAtDate = within(
      screen.getByTestId('starting-at-date-picker'),
    ).getByRole('presentation');
    expect(inputStartingAtDate).toHaveTextContent('1/27/2022');

    await userEvent.click(
      screen.getByRole('button', {
        name: /Clear date/i,
      }),
    );

    expect(inputStartingAtDate).toHaveTextContent('mm/dd/yyyy');

    expect(onStartingAtChange).toHaveBeenCalledWith(null);

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    fireEvent.change(inputStartingAtTime, { target: { value: null } });
    expect(onStartingAtChange).toHaveBeenCalledWith(null);

    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    fireEvent.change(inputEstimatedDuration, { target: { value: null } });
    expect(onEstimatedDurationChange).toHaveBeenCalledWith(null);
  });

  it('does not allow to set a date outside bounded range', async () => {
    const onStartingAtChange = jest.fn();
    const onEstimatedDurationChange = jest.fn();

    render(
      <SchedulingFields
        startingAt={null}
        estimatedDuration={null}
        onStartingAtChange={onStartingAtChange}
        onEstimatedDurationChange={onEstimatedDurationChange}
      />,
    );

    const startingAtPast = DateTime.local().minus({ days: 1 });
    const inputStartingAtDate = within(
      screen.getByTestId('starting-at-date-picker'),
    ).getByRole('presentation');
    expect(inputStartingAtDate).toHaveTextContent('mm/dd/yyyy');
    await userTypeDatePicker(
      startingAtPast,
      screen.getByText(/Starting date/i),
    );
    const allSpin = await screen.findAllByRole('spinbutton');

    allSpin.forEach((spin) => {
      expect(spin).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
