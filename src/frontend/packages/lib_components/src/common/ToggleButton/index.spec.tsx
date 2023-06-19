import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { ToggleButton } from '.';

const onChangeButtonMock = jest.fn();

describe('<ToogleButton />', () => {
  beforeEach(() => jest.resetAllMocks());
  it('renders the toggle button unchecked and performs a click on it', async () => {
    render(
      <ToggleButton
        checked={false}
        onChange={onChangeButtonMock}
        title="An example title"
      />,
    );

    const toggleButton = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleButton).not.toBeChecked();

    await userEvent.click(toggleButton);

    expect(onChangeButtonMock).toHaveBeenCalledTimes(1);
  });

  it('renders the toggle button checked and performs a click on it', async () => {
    render(
      <ToggleButton
        checked={true}
        onChange={onChangeButtonMock}
        title="An example title"
      />,
    );

    const toggleButton = screen.getByRole('checkbox', {
      name: 'An example title',
    });
    expect(toggleButton).toBeChecked();

    await userEvent.click(toggleButton);

    expect(onChangeButtonMock).toHaveBeenCalledTimes(1);
  });

  it('renders the toggle button disabled and performs a click on it', async () => {
    render(
      <ToggleButton
        checked={true}
        disabled
        onChange={onChangeButtonMock}
        title="An example title"
      />,
    );

    const toggleButton = screen.getByRole('checkbox', {
      name: 'An example title',
    });

    await userEvent.click(toggleButton);

    expect(onChangeButtonMock).toHaveBeenCalledTimes(0);
  });
});
