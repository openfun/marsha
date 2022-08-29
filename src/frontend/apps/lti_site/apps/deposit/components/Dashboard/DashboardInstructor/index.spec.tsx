import { act, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient } from 'react-query';

import { APIList } from 'types/api';
import { uploadState } from 'types/tracks';
import { Deferred } from 'utils/tests/Deferred';
import render from 'utils/tests/render';

import { DepositedFile } from 'apps/deposit/types/models';
import {
  depositedFileMockFactory,
  fileDepositoryMockFactory,
} from 'apps/deposit/utils/tests/factories';

import { DashboardInstructor } from '.';

const { READY } = uploadState;

describe('<DashboardInstructor />', () => {
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
      `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=0`,
      deferred.promise,
    );
    render(<DashboardInstructor fileDepository={fileDepository} />, {
      queryOptions: {
        client: queryClient,
      },
    });

    const loader = screen.getByRole('status');
    expect(
      fetchMock.called(
        `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=0`,
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
    screen.getByText('Students files');
    screen.getByText('John Doe');
    screen.getByText('01/01/2020');
    screen.getByText('00:00');
    screen.getByText('12.1 KB');
    screen.getByText('file.txt');
    const downloadButton = screen.getByRole('link', { name: 'Download' });
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/file.txt',
    );
  });

  it('paginates deposited files', async () => {
    const fileDepository = fileDepositoryMockFactory();
    const depositedFiles: DepositedFile[] = [];
    for (let i = 0; i < 40; i++) {
      depositedFiles.push(
        depositedFileMockFactory({ file_depository: fileDepository }),
      );
    }
    const queryClient = new QueryClient();
    const deferred = new Deferred<APIList<DepositedFile>>();
    fetchMock.get(
      `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=0`,
      deferred.promise,
    );
    render(<DashboardInstructor fileDepository={fileDepository} />, {
      queryOptions: {
        client: queryClient,
      },
    });

    const loader = screen.getByRole('status');

    act(() => {
      deferred.resolve({
        count: 40,
        next: `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=10`,
        previous: '',
        results: depositedFiles.slice(0, 10),
      });
    });

    await waitForElementToBeRemoved(loader);

    screen.getByText('Showing 1 - 10 of 40');
    depositedFiles.slice(0, 10).forEach((depositedFile) => {
      screen.getByText(depositedFile.filename);
    });

    fetchMock.get(
      `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=10`,
      deferred.promise,
    );
    userEvent.click(screen.getByRole('button', { name: /go to page 2/i }));

    act(() => {
      deferred.resolve({
        count: 40,
        next: `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=20`,
        previous: '',
        results: depositedFiles.slice(10, 20),
      });
    });

    screen.getByText('Showing 11 - 20 of 40');
    depositedFiles.slice(10, 20).forEach((depositedFile) => {
      screen.findByText(depositedFile.filename);
    });
  });

  it('filters deposited files', async () => {
    const fileDepository = fileDepositoryMockFactory();
    const depositedFiles: DepositedFile[] = [];
    for (let i = 0; i < 40; i++) {
      const read = i % 2 === 0;
      const readStatus = read ? 'read' : 'new';
      depositedFiles.push(
        depositedFileMockFactory({
          file_depository: fileDepository,
          filename: `file${i}_${readStatus}.txt`,
          read,
        }),
      );
    }
    const queryClient = new QueryClient();
    fetchMock.get(
      `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=0`,
      {
        count: 40,
        next: `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=10`,
        previous: '',
        results: depositedFiles.slice(0, 10),
      },
    );
    render(<DashboardInstructor fileDepository={fileDepository} />, {
      queryOptions: {
        client: queryClient,
      },
    });

    await screen.findByText('Showing 1 - 10 of 40');
    for (let i = 0; i < 10; i++) {
      const read = i % 2 === 0;
      const readStatus = read ? 'read' : 'new';
      await screen.findByText(`file${i}_${readStatus}.txt`);
    }

    // filter by unread
    fetchMock.get(
      `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=0&read=false`,
      {
        count: 20,
        next: `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=10&read=false`,
        previous: '',
        results: depositedFiles
          .slice(0, 20)
          .filter((depositedFile) => !depositedFile.read),
      },
    );

    const fileFilter = screen.getByRole('button', { name: /Filter files/i });
    userEvent.click(fileFilter);
    userEvent.click(await screen.findByRole('option', { name: 'Unread' }));

    await screen.findByText('Showing 1 - 10 of 20');
    for (let i = 0; i < 10; i++) {
      await screen.findByText(`file${i * 2 + 1}_new.txt`);
    }

    // filter by read
    fetchMock.get(
      `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=0&read=true`,
      {
        count: 20,
        next: `/api/filedepositories/${fileDepository.id}/depositedfiles/?limit=10&offset=10&read=true`,
        previous: '',
        results: depositedFiles
          .slice(0, 20)
          .filter((depositedFile) => depositedFile.read),
      },
    );

    userEvent.click(fileFilter);
    userEvent.click(await screen.findByRole('option', { name: 'Read' }));

    await screen.findByText('Showing 1 - 10 of 20');
    for (let i = 0; i < 10; i++) {
      await screen.findByText(`file${i * 2}_read.txt`);
    }
  });
});
