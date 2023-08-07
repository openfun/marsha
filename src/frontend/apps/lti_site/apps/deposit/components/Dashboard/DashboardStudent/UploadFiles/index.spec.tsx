import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  DepositedFile,
  UploadManagerStatus,
  FileDepositoryModelName as modelName,
  uploadState,
  useUploadManager,
} from 'lib-components';
import { Deferred, render } from 'lib-tests';
import React, { PropsWithChildren } from 'react';

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
    expect(
      screen.getByText(
        "Drag 'n' drop some files here, or click to select files",
      ),
    ).toBeInTheDocument();
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

    render(<UploadFiles />);

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    await userEvent.upload(screen.getByLabelText('File Upload'), file);

    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const depositedFile = depositedFileMockFactory();
    createDeferred.resolve(depositedFile);

    await waitFor(() => expect(mockAddUpload).toHaveBeenCalledTimes(1));
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.DepositedFiles,
      depositedFile.id,
      file,
      depositedFile.file_depository_id,
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
      '/api/filedepositories/1/depositedfiles/',
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );

    render(<UploadFiles />);

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    await userEvent.upload(screen.getByLabelText('File Upload'), file);

    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
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
    expect(
      await screen.findByText(
        'Upload in progress... Please do not close or reload this page.',
      ),
    ).toBeInTheDocument();
  });
});
