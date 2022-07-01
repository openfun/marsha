import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import render from 'utils/tests/render';

import { depositedFileMockFactory } from 'apps/deposit/utils/tests/factories';
import { DepositedFileRow } from '.';

const { READY } = uploadState;

describe('<DepositedFileRow />', () => {
  it('shows deposited file row', async () => {
    const depositedFile = depositedFileMockFactory({
      filename: 'file.txt',
      size: '12345',
      upload_state: 'ready',
      uploaded_by: 'user',
      uploaded_on: '2020-01-01T00:00:00Z',
      url: 'https://example.com/file.txt',
    });
    render(<DepositedFileRow file={depositedFile} />);
    screen.getByText('user');
    screen.getByText('01/01/2020');
    screen.getByText('00:00');
    screen.getByText('12.1 KB');
    screen.getByText('file.txt');
    const downloadButton = screen.getByRole('link', { name: 'Download' });
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/file.txt',
    );
    userEvent.click(downloadButton);
  });
});
