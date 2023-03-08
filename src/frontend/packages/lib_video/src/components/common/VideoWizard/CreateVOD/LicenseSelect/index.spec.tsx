import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

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

    expect(
      screen.getByRole('button', {
        name: 'Select the license under which you want to publish your video; Selected: CC_BY',
      }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('textbox', {
        name: 'Select the license under which you want to publish your video, CC_BY',
      }),
    ).toHaveValue('Creative Common By Attribution');
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

    expect(
      screen.getByRole('button', {
        name: 'Select the license under which you want to publish your video; Selected: CC_BY',
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole('textbox', {
        name: 'Select the license under which you want to publish your video, CC_BY',
      }),
    ).toHaveValue('Creative Common By Attribution');
  });

  it('renders the component with no licenses', async () => {
    fetchMock.mock('/api/videos/', 500, { method: 'OPTIONS' });

    render(<LicenseSelect onChange={onChangeMock} />);

    await waitFor(() =>
      expect(onChangeMock).toHaveBeenCalledWith({
        label: 'No license availables',
        value: 'error',
      }),
    );

    expect(
      screen.queryByRole('button', {
        name: 'Select the license under which you want to publish your video; Selected: CC_BY',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', {
        name: 'Select the license under which you want to publish your video, CC_BY',
      }),
    ).not.toBeInTheDocument();

    screen.getByRole('button', {
      name: 'Select the license under which you want to publish your video; Selected: error',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the license under which you want to publish your video, error',
      }),
    ).toHaveValue('No license availables');
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
    const selectButton = screen.getByRole('button', {
      name: 'Select the license under which you want to publish your video; Selected: CC_BY',
    });

    userEvent.click(selectButton);

    screen.getByRole('button', {
      name: 'Select the license under which you want to publish your video; Selected: CC_BY',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the license under which you want to publish your video, CC_BY',
      }),
    ).toHaveValue('Creative Common By Attribution');
    const allRightsReservedButtonOption = screen.getByRole('option', {
      name: 'All rights reserved',
    });

    userEvent.click(allRightsReservedButtonOption);

    screen.getByRole('button', {
      name: 'Select the license under which you want to publish your video; Selected: NO_CC',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the license under which you want to publish your video, NO_CC',
      }),
    ).toHaveValue('All rights reserved');
  });
});
