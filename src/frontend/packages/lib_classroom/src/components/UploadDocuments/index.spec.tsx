import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  UploadManagerStatus,
  useUploadManager,
  uploadState,
  ClassroomDocument,
  ClassroomModelName as modelName,
  report,
} from 'lib-components';
import { render, Deferred } from 'lib-tests';
import React, { PropsWithChildren } from 'react';

import { createClassroomDocument } from '@lib-classroom/data/sideEffects/createClassroomDocument';
import { classroomDocumentMockFactory } from '@lib-classroom/utils/tests/factories';

import { UploadDocuments } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
  useUploadManager: jest.fn(),
  UploadManagerContext: {
    Provider: ({ children }: PropsWithChildren<{}>) => children,
  },
  UploadManagerStatus: jest.requireActual('lib-components').UploadManagerStatus,
  report: jest.fn(),
}));

const mockUseUploadManager = useUploadManager as jest.MockedFunction<
  typeof useUploadManager
>;

mockUseUploadManager.mockReturnValue({
  addUpload: jest.fn(),
  resetUpload: jest.fn(),
  uploadManagerState: {},
});

jest.mock('data/sideEffects/createClassroomDocument', () => ({
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
    render(<UploadDocuments classroomId="1" />);

    expect(
      screen.getByText(
        "Drag 'n' drop some files here, or click to select files",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Upload files to your classroom:'),
    ).toBeInTheDocument();
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

    render(<UploadDocuments classroomId="1" />);

    const file = new File(['(⌐□_□)'], 'course.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(screen.getByLabelText('File Upload'), {
      target: {
        files: [file],
      },
    });
    expect(await screen.findByText('course.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    const classroomDocument = classroomDocumentMockFactory();
    createDeferred.resolve(classroomDocument);

    await waitFor(() => expect(mockAddUpload).toHaveBeenCalledTimes(1));
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

    render(<UploadDocuments classroomId="1" />);

    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    fireEvent.change(screen.getByLabelText('File Upload'), {
      target: {
        files: [file],
      },
    });

    // We cannot easily asset that something asynchrone is not in the document,
    // so we wait a bit to be sure that the mp4 file is rejected
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 500);
      });
    });

    expect(screen.queryByText('course.mp4')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload')).not.toBeInTheDocument();
  });

  it('rejects files too large and displays a related error message', async () => {
    mockCreateClassroomDocument.mockRejectedValue({
      size: ['File too large !'],
    });

    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    fetchMock.mock(
      '/api/classroomdocuments/',
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );

    render(<UploadDocuments classroomId="1" />);

    const file = new File(['(⌐□_□)'], 'course.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(screen.getByLabelText('File Upload'), {
      target: {
        files: [file],
      },
    });
    expect(await screen.findByText('course.pdf')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() =>
      expect(mockCreateClassroomDocument).toHaveBeenCalledTimes(1),
    );

    expect(screen.queryByText('course.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload')).not.toBeInTheDocument();
    expect(
      await screen.findByText('Uploaded files exceeds allowed size of 1 GB.'),
    ).toBeInTheDocument();
  });

  it('rejects files on error and displays a message', async () => {
    mockCreateClassroomDocument.mockRejectedValue({
      type: ['Something went wrong !'],
    });

    fetchMock.get('/api/classrooms/1/classroomdocuments/?limit=999', {
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    fetchMock.mock(
      '/api/classroomdocuments/',
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );

    render(<UploadDocuments classroomId="1" />);

    const file = new File(['(⌐□_□)'], 'course.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(screen.getByLabelText('File Upload'), {
      target: {
        files: [file],
      },
    });
    expect(await screen.findByText('course.pdf')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() =>
      expect(mockCreateClassroomDocument).toHaveBeenCalledTimes(1),
    );

    expect(screen.queryByText('course.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload')).not.toBeInTheDocument();
    expect(
      await screen.findByText(
        'An error occurred when uploading your file. Please retry.',
      ),
    ).toBeInTheDocument();
    expect(report).toHaveBeenCalledWith({
      type: ['Something went wrong !'],
    });
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

    fetchMock.mock(
      '/api/classroomdocuments/',
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );

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
    render(<UploadDocuments classroomId="1" />);

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(2));
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

    fetchMock.mock(
      '/api/classroomdocuments/',
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );

    render(<UploadDocuments classroomId="1" />);

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

    fetchMock.mock(
      '/api/classroomdocuments/',
      {
        upload_max_size_bytes: Math.pow(10, 9),
      },
      { method: 'OPTIONS' },
    );

    fetchMock.patch(`/api/classroomdocuments/${classroomDocument.id}/`, {
      status: 200,
    });

    render(<UploadDocuments classroomId="1" />);

    await screen.findByText('file.txt');
    const downloadButton = screen.getByRole('button', {
      name: 'Click to set as default document',
    });

    userEvent.click(downloadButton);

    await waitFor(() =>
      expect(fetchMock.calls()[2]![1]!.body).toEqual(
        JSON.stringify({ is_default: true }),
      ),
    );
  });
});
