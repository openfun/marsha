import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import render from 'utils/tests/render';

import { RetryButton } from '.';

const mockRetryFn = jest.fn();

describe('<RetryButton />', () => {
  it('renders the retry button and clicks on it', () => {
    render(<RetryButton onClick={mockRetryFn} />);

    const retryButton = screen.getByRole('button', {
      name: 'Click on this button to retry uploading your media.',
    });
    userEvent.click(retryButton);
    expect(mockRetryFn).toHaveBeenCalledTimes(1);
  });
});
