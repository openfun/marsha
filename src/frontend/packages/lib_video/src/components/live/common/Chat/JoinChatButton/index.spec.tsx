import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { theme } from 'lib-common';
import { render, renderImageSnapshot } from 'lib-tests';

import { JoinChatButton } from './index';

const mockHandleClick = jest.fn();

describe('<JoinChatButton />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('renders the button and compares it with previous snapshot. [screenshot]', async () => {
    await renderImageSnapshot(
      <JoinChatButton disabled={false} handleClick={mockHandleClick} />,
    );

    expect(screen.getByText('Join the chat')).toBeInTheDocument();
  });

  it('renders the button and clicks on it.', async () => {
    render(<JoinChatButton disabled={false} handleClick={mockHandleClick} />, {
      grommetOptions: { theme },
    });
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('renders the button and clicks on it when it is disabled', async () => {
    render(<JoinChatButton disabled={true} handleClick={mockHandleClick} />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(mockHandleClick).toHaveBeenCalledTimes(0);
  });
});
