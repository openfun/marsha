import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';

import { LicenseSelect } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const onChangeMock = jest.fn();

const licenseChoices = [
  { display_name: 'Creative Common By Attribution', value: 'CC_BY' },
  {
    display_name: 'Creative Common By Attribution Share Alike',
    value: 'CC_BY-SA',
  },
  {
    display_name: 'Creative Common By Attribution Non Commercial No Derivates',
    value: 'CC_BY-NC-ND',
  },
  { display_name: 'Public Domain Dedication ', value: 'CC0' },
  { display_name: 'All rights reserved', value: 'NO_CC' },
];

describe('<LicenseSelect />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the component with default license', async () => {
    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { choices: licenseChoices } } },
      },
      { method: 'OPTIONS' },
    );

    render(<LicenseSelect onChange={onChangeMock} />);

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenCalledWith({
        label: 'Creative Common By Attribution',
        value: 'CC_BY',
      }),
    );

    const selectButton = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(selectButton).findByText('Creative Common By Attribution'),
    ).toBeInTheDocument();
  });

  it('renders the component but is disabled', async () => {
    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { choices: licenseChoices } } },
      },
      { method: 'OPTIONS' },
    );

    render(<LicenseSelect disabled onChange={onChangeMock} />);

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenCalledWith({
        label: 'Creative Common By Attribution',
        value: 'CC_BY',
      }),
    );

    const selectButton = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(selectButton).findByText('Creative Common By Attribution'),
    ).toBeInTheDocument();
  });

  it('renders the component with no licenses', async () => {
    fetchMock.mock('/api/videos/', 500, { method: 'OPTIONS' });

    render(<LicenseSelect onChange={onChangeMock} />);

    expect(
      await screen.findByText(
        'Something went wrong when loading the licenses, refresh the page or try again later.',
      ),
    ).toBeInTheDocument();
  });

  it('changes the selected license', async () => {
    fetchMock.mock(
      `/api/videos/`,
      {
        actions: { POST: { license: { choices: licenseChoices } } },
      },
      { method: 'OPTIONS' },
    );

    render(<LicenseSelect onChange={onChangeMock} />);

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenCalledWith({
        label: 'Creative Common By Attribution',
        value: 'CC_BY',
      }),
    );

    const selectButton = await screen.findByRole('combobox', {
      name: 'Select the license',
    });
    expect(
      await within(selectButton).findByText('Creative Common By Attribution'),
    ).toBeInTheDocument();

    await userEvent.click(selectButton);

    const allRightsReservedButtonOption = screen.getByRole('option', {
      name: 'All rights reserved',
    });

    await userEvent.click(allRightsReservedButtonOption);

    expect(
      await within(selectButton).findByText('All rights reserved'),
    ).toBeInTheDocument();
  });
});
