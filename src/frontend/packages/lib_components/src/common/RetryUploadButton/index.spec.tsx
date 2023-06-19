import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { RetryUploadButton } from '.';

const mockRetryFn = jest.fn();

describe('<RetryUploadButton />', () => {
  it('renders the retry button and clicks on it', async () => {
    render(<RetryUploadButton color="red-active" onClick={mockRetryFn} />);

    const retryButton = screen.getByRole('button', {
      name: 'Click on this button to retry uploading your failed upload.',
    });
    await userEvent.click(retryButton);
    expect(mockRetryFn).toHaveBeenCalledTimes(1);
  });
});
