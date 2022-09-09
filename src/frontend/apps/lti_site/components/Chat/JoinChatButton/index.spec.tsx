import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderImageSnapshot } from 'utils/tests/imageSnapshot';
import render from 'utils/tests/render';
import { theme } from 'lib-common';

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
    screen.getByText('Join the chat');
  });

  it('renders the button and clicks on it.', () => {
    render(<JoinChatButton disabled={false} handleClick={mockHandleClick} />, {
      grommetOptions: { theme },
    });
    const button = screen.getByRole('button');
    userEvent.click(button);
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
  });

  it('renders the button and clicks on it when it is disabled', () => {
    render(<JoinChatButton disabled={true} handleClick={mockHandleClick} />);
    const button = screen.getByRole('button');
    userEvent.click(button);
    expect(mockHandleClick).toHaveBeenCalledTimes(0);
  });
});
