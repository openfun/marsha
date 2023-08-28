import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render, userTypeDatePicker } from 'lib-tests';
import { DateTime, Settings } from 'luxon';

import { InfoWidgetModalProvider } from '@lib-components/hooks/stores/useInfoWidgetModal';

import { RetentionDate } from '.';

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const mockedOnChange = jest.fn();
const onChange = (new_retention_date: string | null) =>
  mockedOnChange(new_retention_date);

describe('RetentionDate', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the component and set a date with success', async () => {
    render(
      <InfoWidgetModalProvider value={null}>
        <RetentionDate
          retentionDate={null}
          ressource="test"
          onChange={onChange}
        />
      </InfoWidgetModalProvider>,
    );

    expect(screen.getAllByText('Retention date')).toBeTruthy();

    const inputStartingAtDate = within(
      screen.getByTestId('retention-date-picker'),
    ).getByRole('presentation');

    expect(inputStartingAtDate).toHaveTextContent('mm/dd/yyyy');

    const startingAt = DateTime.local()
      .plus({ days: 1 })
      .set({ second: 0, millisecond: 0 });

    await userTypeDatePicker(
      startingAt,
      screen.getAllByText(/Retention date/i)[1],
    );

    expect(inputStartingAtDate).toHaveTextContent(startingAt.toLocaleString());

    await waitFor(() => expect(mockedOnChange).toHaveBeenCalledTimes(1));
  });

  it("set a date previous at today and don't change", async () => {
    render(
      <InfoWidgetModalProvider value={null}>
        <RetentionDate
          retentionDate={null}
          ressource="test"
          onChange={onChange}
        />
      </InfoWidgetModalProvider>,
    );

    expect(screen.getAllByText('Retention date')).toBeTruthy();

    const inputStartingAtDate = within(
      screen.getByTestId('retention-date-picker'),
    ).getByRole('presentation');

    expect(inputStartingAtDate).toHaveTextContent('mm/dd/yyyy');

    const startingAt = DateTime.local()
      .minus({ days: 1 })
      .set({ second: 0, millisecond: 0 });

    await userTypeDatePicker(
      startingAt,
      screen.getAllByText(/Retention date/i)[1],
    );

    expect(inputStartingAtDate).toHaveTextContent(startingAt.toLocaleString());

    await waitFor(() => expect(mockedOnChange).not.toHaveBeenCalled());
  });

  it('renders the component with a default date and deletes it', async () => {
    render(
      <InfoWidgetModalProvider value={null}>
        <RetentionDate
          retentionDate="2020-03-01"
          ressource="test"
          onChange={onChange}
        />
      </InfoWidgetModalProvider>,
    );

    expect(screen.getAllByText('Retention date')).toBeTruthy();

    const inputStartingAtDate = within(
      screen.getByTestId('retention-date-picker'),
    ).getByRole('presentation');
    expect(inputStartingAtDate).toHaveTextContent('3/1/2020');

    const deleteButton = await screen.findByRole('button', {
      name: 'Delete retention date',
    });

    await userEvent.click(deleteButton);

    await waitFor(() => expect(mockedOnChange).toHaveBeenCalledTimes(1));
    expect(inputStartingAtDate).toHaveTextContent('mm/dd/yyyy');
  });
});
