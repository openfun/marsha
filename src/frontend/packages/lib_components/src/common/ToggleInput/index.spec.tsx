import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Box } from 'grommet';
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

  it('renders a truncated label', () => {
    render(
      <Box width="10px">
        <ToggleInput
          checked={true}
          disabled
          label="An example title"
          onChange={onChangeToggleMock}
        />
        ,
      </Box>,
    );

    const text = screen.getByText('An example title');
    expect(text).toHaveStyle('text-overflow: ellipsis');
  });

  it('renders a non truncated label', () => {
    render(
      <Box width="10px">
        <ToggleInput
          checked={true}
          disabled
          label="An example title"
          onChange={onChangeToggleMock}
          truncateLabel={false}
        />
        ,
      </Box>,
    );

    const text = screen.getByText('An example title');
    expect(text).not.toHaveStyle('text-overflow: ellipsis');
  });
});
