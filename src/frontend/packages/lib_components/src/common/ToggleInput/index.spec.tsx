import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { ToggleInput } from './index';

const onChangeToggleMock = jest.fn();

describe('<ToggleInput />', () => {
  beforeEach(() => jest.resetAllMocks());

  it('renders the toggle input unchecked and performs a click on it', async () => {
    render(
      <ToggleInput
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

    await userEvent.click(toggleInput);

    expect(onChangeToggleMock).toHaveBeenCalledTimes(1);
  });

  it('renders the toggle input checked and performs a click on it', async () => {
    render(
      <ToggleInput
        checked={true}
        label="An example title"
        onChange={onChangeToggleMock}
      />,
    );

    screen.getByText('An example title');
    const toggleInput = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleInput).toBeChecked();

    await userEvent.click(toggleInput);

    expect(onChangeToggleMock).toHaveBeenCalledTimes(1);
  });

  it('renders the toggle input disabled and performs a click on it', async () => {
    render(
      <ToggleInput
        checked={true}
        disabled
        label="An example title"
        onChange={onChangeToggleMock}
      />,
    );

    screen.getByText('An example title');
    const toggleInput = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleInput).toBeChecked();

    await userEvent.click(toggleInput);

    expect(onChangeToggleMock).toHaveBeenCalledTimes(0);
  });
});
