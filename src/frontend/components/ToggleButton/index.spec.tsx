import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { ToggleButton } from './index';

const onChangeButtonMock = jest.fn();

describe('<ToogleButton />', () => {
  beforeEach(() => jest.resetAllMocks());
  it('renders the toggle button unchecked and performs a click on it', () => {
    render(
      <ToggleButton
        checked={false}
        onChange={onChangeButtonMock}
        title={'An example title'}
      />,
    );

    const toggleButton = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleButton).not.toBeChecked();

    userEvent.click(toggleButton);

    expect(onChangeButtonMock).toHaveBeenCalledTimes(1);
  });
  it('renders the toggle button checked and performs a click on it', () => {
    render(
      <ToggleButton
        checked={true}
        onChange={onChangeButtonMock}
        title={'An example title'}
      />,
    );

    const toggleButton = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleButton).toBeChecked();

    userEvent.click(toggleButton);

    expect(onChangeButtonMock).toHaveBeenCalledTimes(1);
  });
  it('renders the toggle button disabled and performs a click on it', () => {
    render(
      <ToggleButton
        checked={true}
        disabled
        onChange={onChangeButtonMock}
        title={'An example title'}
      />,
    );

    const toggleButton = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    userEvent.click(toggleButton);

    expect(onChangeButtonMock).toHaveBeenCalledTimes(0);
  });
});
