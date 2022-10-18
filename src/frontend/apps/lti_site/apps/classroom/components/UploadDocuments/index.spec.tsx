import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import React, { PropsWithChildren } from 'react';
import fetchMock from 'fetch-mock';

import {
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { render, Deferred } from 'lib-tests';
import { uploadState } from 'types/tracks';

import { createClassroomDocument } from 'apps/classroom/data/sideEffects/createClassroomDocument';
import {
  ClassroomDocument,
  ClassroomModelName as modelName,
} from 'lib-components';
import { classroomDocumentMockFactory } from 'apps/classroom/utils/tests/factories';

import { UploadDocuments } from '.';
import userEvent from '@testing-library/user-event';

jest.mock('data/stores/useAppConfig', () => ({ useAppConfig: () => ({}) }));

jest.mock('apps/classroom/data/classroomAppData', () => ({
  classroomAppData: {
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

jest.mock('apps/classroom/data/sideEffects/createClassroomDocument', () => ({
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

    const file = new File(['(⌐□_□)'], 'course.pdf', {
      type: 'application/pdf',
    });
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: {
          files: [file],
        },
      });
    });
    expect(screen.queryByText('course.pdf')).toBeInTheDocument();
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

  it('rejects files other than pdf', async () => {
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
    expect(screen.queryByText('course.mp4')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload')).not.toBeInTheDocument();
  });

  it('shows the upload progress when the file is uploading', async () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const classroomDocument = classroomDocumentMockFactory({
      filename: file.name,
      upload_state: PENDING,
      uploaded_on: '2020-01-01T00:00:00Z',
      url: 'https://example.com/file.txt',
    });
    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 1,
      next: null,
      previous: null,
      results: [classroomDocument],
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

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    // file exist in both uploadmanager and classrooms.classroomdocuments,
    // but only the uploadmanager one is rendered.
    await screen.findByText(file.name);
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

  it('updates classroom documents defaults', async () => {
    const classroomDocument = classroomDocumentMockFactory({
      filename: 'file.txt',
      is_default: false,
      upload_state: READY,
      uploaded_on: '2020-01-01T00:00:00Z',
      url: 'https://example.com/file.txt',
    });
    const classroomDocument2 = classroomDocumentMockFactory({
      filename: 'file2.txt',
      is_default: true,
      upload_state: READY,
      uploaded_on: '2020-01-01T00:00:00Z',
      url: 'https://example.com/file2.txt',
    });
    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 2,
      next: null,
      previous: null,
      results: [classroomDocument, classroomDocument2],
    });

    fetchMock.patch(`/api/classroomdocuments/${classroomDocument.id}/`, {
      status: 200,
    });

    render(<UploadDocuments />);

    await screen.findByText('file.txt');
    const downloadButton = screen.getByRole('button', {
      name: 'Click to set as default document',
    });
    await act(async () => {
      userEvent.click(downloadButton);
    });
    expect(fetchMock.lastCall()![1]!.body).toEqual(
      JSON.stringify({ is_default: true }),
    );
  });
});
