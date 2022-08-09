import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import render from 'utils/tests/render';
import { UploadVideoRetry } from '.';

const mockedOnClick = jest.fn();

describe('<UploadVideoRetry />', () => {
  it('renders UploadVideoRetry and clicks on it', () => {
    render(<UploadVideoRetry onClickRetry={mockedOnClick} />);
    screen.getByText(
      'An error occured when uploading your video. Please retry.',
    );
    const retryButton = screen.getByRole('button');
    act(() => userEvent.click(retryButton));
    expect(mockedOnClick).toHaveBeenCalledTimes(1);
  });
});
