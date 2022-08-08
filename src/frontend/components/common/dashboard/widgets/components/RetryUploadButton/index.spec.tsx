import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import render from 'utils/tests/render';

import { RetryUploadButton } from '.';

const mockRetryFn = jest.fn();

describe('<RetryUploadButton />', () => {
  it('renders the retry button and clicks on it', () => {
    render(<RetryUploadButton onClick={mockRetryFn} />);

    const retryButton = screen.getByRole('button', {
      name: 'Click on this button to retry uploading your failed upload.',
    });
    userEvent.click(retryButton);
    expect(mockRetryFn).toHaveBeenCalledTimes(1);
  });
});
