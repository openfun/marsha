import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import React, { PropsWithChildren } from 'react';
import fetchMock from 'fetch-mock';

import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { Deferred } from 'utils/tests/Deferred';
import render from 'utils/tests/render';
import { uploadState } from 'types/tracks';

import { createClassroomDocument } from 'apps/bbb/data/sideEffects/createClassroomDocument';
import { ClassroomDocument, modelName } from 'apps/bbb/types/models';
import { classroomDocumentMockFactory } from 'apps/bbb/utils/tests/factories';

import { UploadDocuments } from '.';

jest.mock('data/stores/useAppConfig', () => ({ useAppConfig: () => ({}) }));

jest.mock('apps/bbb/data/bbbAppData', () => ({
  bbbAppData: {
    modelName: 'classrooms',
    classroom: {
      id: '1',
    },
  },
}));

jest.mock('components/UploadManager', () => ({
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('components/UploadManager')
    .UploadManagerStatus,
}));
const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

mockUseUploadManager.mockReturnValue({
  addUpload: jest.fn(),
  resetUpload: jest.fn(),
  uploadManagerState: {},
});

jest.mock('apps/bbb/data/sideEffects/createClassroomDocument', () => ({
  createClassroomDocument: jest.fn(),
}));
const mockCreateClassroomDocument =
  createClassroomDocument as jest.MockedFunction<
    typeof createClassroomDocument
  >;

const { PENDING, READY } = uploadState;

describe('<UploadDocuments />', () => {
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders a Dropzone with the relevant messages', () => {
    render(<UploadDocuments />);
    screen.getByText("Drag 'n' drop some files here, or click to select files");
  });

  it('passes the file to the callback', async () => {
    const createDeferred = new Deferred<ClassroomDocument>();
    mockCreateClassroomDocument.mockReturnValue(createDeferred.promise);

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    const { container } = render(<UploadDocuments />);

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: {
          files: [file],
        },
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const classroomDocument = classroomDocumentMockFactory();
    createDeferred.resolve(classroomDocument);

    await waitFor(() => expect(expect(mockAddUpload).toHaveBeenCalledTimes(1)));
    expect(mockAddUpload).toHaveBeenLastCalledWith(
      modelName.CLASSROOM_DOCUMENTS,
      classroomDocument.id,
      file,
    );
  });

  it('shows the upload progress when the file is uploading', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const classroomDocument = classroomDocumentMockFactory({
      upload_state: PENDING,
    });

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {
        [classroomDocument.id]: {
          file,
          objectType: modelName.CLASSROOM_DOCUMENTS,
          objectId: classroomDocument.id,
          progress: 20,
          status: UploadManagerStatus.UPLOADING,
        },
      },
    });
    render(<UploadDocuments />);

    await screen.findByText('20%');
    await screen.findByText(
      'Upload in progress... Please do not close or reload this page.',
    );
  });

  it('shows existing classroom documents in the list', async () => {
    const classroomDocument = classroomDocumentMockFactory({
      filename: 'file.txt',
      upload_state: READY,
      uploaded_on: '2020-01-01T00:00:00Z',
      url: 'https://example.com/file.txt',
    });
    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 1,
      next: null,
      previous: null,
      results: [classroomDocument],
    });
    render(<UploadDocuments />);

    await screen.findByText('file.txt');
    const downloadButton = screen.getByRole('link', { name: 'Download' });
    expect(downloadButton).toHaveAttribute(
      'href',
      'https://example.com/file.txt',
    );
  });
});
