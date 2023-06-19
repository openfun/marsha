import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { UploadVideoRetry } from '.';

const mockedOnClick = jest.fn();

describe('<UploadVideoRetry />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders UploadVideoRetry and clicks on it', async () => {
    render(<UploadVideoRetry onClickRetry={mockedOnClick} />);
    screen.getByText(
      'An error occured when uploading your video. Please retry.',
    );
    const retryButton = screen.getByRole('button');

    await userEvent.click(retryButton);

    expect(mockedOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders UploadVideoRetry with sizeError and clicks on it', async () => {
    render(
      <UploadVideoRetry
        onClickRetry={mockedOnClick}
        maxSize={Math.pow(10, 9)}
      />,
    );
    screen.getByText('Error : File too large. Max size authorized is 1 GB.');
    const retryButton = screen.getByRole('button');

    await userEvent.click(retryButton);

    expect(mockedOnClick).toHaveBeenCalledTimes(1);
  });
});
