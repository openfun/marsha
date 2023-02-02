import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { render, Deferred } from 'lib-tests';
import React, { PropsWithChildren } from 'react';
import fetchMock from 'fetch-mock';

import {
  UploadManagerStatus,
  useUploadManager,
  uploadState,
  DepositedFile,
  FileDepositoryModelName as modelName,
} from 'lib-components';

import { createDepositedFile } from 'apps/deposit/data/sideEffects/createDepositedFile';
import { depositedFileMockFactory } from 'apps/deposit/utils/tests/factories';

import { UploadFiles } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('lib-components').UploadManagerStatus,
}));

jest.mock('apps/deposit/data/depositAppData', () => ({
  depositAppData: {
    modelName: 'file_depositories',
    fileDepository: {
      id: '1',
    },
    jwt: 'token',
  },
}));

const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

mockUseUploadManager.mockReturnValue({
  addUpload: jest.fn(),
  resetUpload: jest.fn(),
  uploadManagerState: {},
});

jest.mock('apps/deposit/data/sideEffects/createDepositedFile', () => ({
  createDepositedFile: jest.fn(),
}));
const mockCreateDepositedFile = createDepositedFile as jest.MockedFunction<
  typeof createDepositedFile
>;

const { PENDING } = uploadState;

describe('<UploadFiles />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders a Dropzone with the relevant messages', () => {
    render(<UploadFiles />);
    screen.getByText("Drag 'n' drop some files here, or click to select files");
  });

  it('passes the file to the callback', async () => {
    const createDeferred = new Deferred<DepositedFile>();
    mockCreateDepositedFile.mockReturnValue(createDeferred.promise);

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    const { container } = render(<UploadFiles />);

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: {
          files: [file],
        },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const depositedFile = depositedFileMockFactory();
    createDeferred.resolve(depositedFile);

    await waitFor(() => expect(expect(mockAddUpload).toHaveBeenCalledTimes(1)));
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.DepositedFiles,
      depositedFile.id,
      file,
    );
  });

  it('rejects files too large and displays a related error message', async () => {
    mockCreateDepositedFile.mockRejectedValue({
      size: ['File too large !'],
    });

    fetchMock.get('/api/filedepositories/1/depositedfiles/?limit=999', {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    fetchMock.mock(
      '/api/depositedfiles/',
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );

    const { container } = render(<UploadFiles />);

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: {
          files: [file],
        },
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await waitFor(() =>
      expect(mockCreateDepositedFile).toHaveBeenCalledTimes(1),
    );

    expect(screen.queryByText('course.mp4')).not.toBeInTheDocument();
    expect(
      await screen.findByText('Uploaded files exceeds allowed size of 1 GB.'),
    ).toBeInTheDocument();
  });

  it('shows the upload progress when the file is uploading', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const depositedFile = depositedFileMockFactory({
      upload_state: PENDING,
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {
        [depositedFile.id]: {
          file,
          objectType: modelName.DepositedFiles,
          objectId: depositedFile.id,
          progress: 20,
          status: UploadManagerStatus.UPLOADING,
        },
      },
    });
    render(<UploadFiles />);

    await screen.findByText('20%');
    await screen.findByText(
      'Upload in progress... Please do not close or reload this page.',
    );
  });
});
