import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import render from 'utils/tests/render';

import {
  depositedFileMockFactory,
  fileDepositoryMockFactory,
} from 'apps/deposit/utils/tests/factories';
import { DashboardStudent } from '.';

const { READY } = uploadState;

jest.mock('./UploadFiles', () => ({
  UploadFiles: () => <p>Upload Files.</p>,
}));

describe('<DashboardStudent />', () => {
  it('shows deposited files from a file depository', async () => {
    const depositedFile = depositedFileMockFactory({
      filename: 'file.txt',
      size: '12345',
      upload_state: 'ready',
      uploaded_by: 'user',
      uploaded_on: '2020-01-01T00:00:00Z',
      url: 'https://example.com/file.txt',
    });
    const fileDepository = fileDepositoryMockFactory({
      id: '1',
      deposited_files: [depositedFile],
    });
    render(<DashboardStudent fileDepository={fileDepository} />);
    screen.getByText('Upload Files.');
    screen.getByText('My files');
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
