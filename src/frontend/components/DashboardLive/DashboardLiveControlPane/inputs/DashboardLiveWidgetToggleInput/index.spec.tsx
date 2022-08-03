import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import render from 'utils/tests/render';

import { DashboardLiveWidgetToggleInput } from './index';

const onChangeToggleMock = jest.fn();

describe('<DashboardLiveWidgetToggleInput />', () => {
  beforeEach(() => jest.resetAllMocks());

  it('renders the toggle input unchecked and performs a click on it', () => {
    render(
      <DashboardLiveWidgetToggleInput
        checked={false}
        label="An example title"
        onChange={onChangeToggleMock}
      />,
    );

    screen.getByText('An example title');
    const toggleInput = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleInput).not.toBeChecked();

    userEvent.click(toggleInput);

    expect(onChangeToggleMock).toHaveBeenCalledTimes(1);
  });
  it('renders the toggle input checked and performs a click on it', () => {
    render(
      <DashboardLiveWidgetToggleInput
        checked={true}
        label={'An example title'}
        onChange={onChangeToggleMock}
      />,
    );

    screen.getByText('An example title');
    const toggleInput = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleInput).toBeChecked();

    userEvent.click(toggleInput);

    expect(onChangeToggleMock).toHaveBeenCalledTimes(1);
  });
  it('renders the toggle input disabled and performs a click on it', () => {
    render(
      <DashboardLiveWidgetToggleInput
        checked={true}
        disabled
        label={'An example title'}
        onChange={onChangeToggleMock}
      />,
    );

    screen.getByText('An example title');
    const toggleInput = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleInput).toBeChecked();

    userEvent.click(toggleInput);

    expect(onChangeToggleMock).toHaveBeenCalledTimes(0);
  });
});
