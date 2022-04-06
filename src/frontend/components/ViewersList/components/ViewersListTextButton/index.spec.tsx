import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { ViewersListTextButton } from '.';

const mockOnClick = jest.fn();

describe('<ViewersListTextButton />', () => {
  beforeEach(() => jest.resetAllMocks());

  it('renders ViewersListTextButton component and clicks on it', () => {
    render(
      <ViewersListTextButton onClick={mockOnClick} text="An example text" />,
    );
    screen.getByText('An example text');
    const button = screen.getByRole('button', { name: 'An example text' });
    act(() => userEvent.click(button));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
