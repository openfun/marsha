import { QueryClient } from '@tanstack/react-query';
import { act, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { APIList, DepositedFile, uploadState } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import React from 'react';

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
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.reset();
  });

  it('shows deposited files from a file depository', async () => {
    const depositedFile = depositedFileMockFactory({
      author_name: 'John Doe',
      filename: 'file.txt',
      size: '12345',
      upload_state: READY,
      uploaded_on: '2020-01-01T00:00:00Z',
      url: 'https://example.com/file.txt',
    });
    const fileDepository = fileDepositoryMockFactory({
      id: '1',
      deposited_files: [depositedFile],
    });

    const queryClient = new QueryClient();
    const deferred = new Deferred<APIList<DepositedFile>>();
    fetchMock.get(
      `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=999`,
      deferred.promise,
    );
    render(<DashboardStudent fileDepository={fileDepository} />, {
      queryOptions: {
        client: queryClient,
      },
    });

    const loader = screen.getByRole('status');
    expect(
      fetchMock.called(
        `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=999`,
      ),
    ).toEqual(true);
    act(() => {
      deferred.resolve({
        count: 1,
        next: '',
        previous: '',
        results: [depositedFile],
      });
    });

    await waitForElementToBeRemoved(loader);
    screen.getByText('Upload Files.');
    screen.getByText('My files');
    screen.getByText('John Doe');
    screen.getByText('01/01/2020 00:00');
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
