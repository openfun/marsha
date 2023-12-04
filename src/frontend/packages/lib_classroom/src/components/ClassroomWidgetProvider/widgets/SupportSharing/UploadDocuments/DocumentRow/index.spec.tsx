import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { uploadState, useJwt } from 'lib-components';
import { wrapInIntlProvider } from 'lib-tests';
import React from 'react';

import {
  classroomDocumentMockFactory,
  classroomMockFactory,
} from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { DocumentRow } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
  }),
}));

const mockedOnRetryFailedUpload = jest.fn();
let queryClient: QueryClient;

describe('<DocumentRow />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders a row in READY state', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const document = classroomDocumentMockFactory({
      filename: 'my_document.pdf',
      classroom_id: classroom.id,
    });
    render(
      wrapInIntlProvider(
        wrapInClassroom(
          <QueryClientProvider client={queryClient}>
            <DocumentRow
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              document={document}
            />
          </QueryClientProvider>,
          classroom,
        ),
      ),
    );
    expect(screen.getByText('my_document.pdf')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Click on this button to delete the media.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('row', { name: 'Click to set as default document' }),
    ).toBeEnabled();
  });

  it('sets a document as default', async () => {
    const classroom = classroomMockFactory({ started: false });
    const document = classroomDocumentMockFactory({
      filename: 'my_document.pdf',
      classroom_id: classroom.id,
    });
    fetchMock.patch(
      `/api/classrooms/${classroom.id}/classroomdocuments/${document.id}/`,
      {
        ...document,
        is_default: true,
      },
    );
    render(
      wrapInIntlProvider(
        wrapInClassroom(
          <QueryClientProvider client={queryClient}>
            <DocumentRow
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              document={document}
            />
          </QueryClientProvider>,
          classroom,
        ),
      ),
    );

    await userEvent.click(
      screen.getByRole('row', { name: 'Click to set as default document' }),
    );
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
  });

  it('renders a row in UPLOAD_IN_PROGRESS state', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const document = classroomDocumentMockFactory({
      filename: 'my_document.pdf',
      classroom_id: classroom.id,
      upload_state: uploadState.PROCESSING,
    });
    render(
      wrapInIntlProvider(
        wrapInClassroom(
          <QueryClientProvider client={queryClient}>
            <DocumentRow
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              document={document}
            />
          </QueryClientProvider>,
          classroom,
        ),
      ),
    );
    expect(screen.getByText('my_document.pdf')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Click on this button to delete the media.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: 'Click to set as default document' }),
    ).not.toBeInTheDocument();
  });

  it('renders a row in FAILED state', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const document = classroomDocumentMockFactory({
      filename: 'my_document.pdf',
      classroom_id: classroom.id,
      upload_state: uploadState.ERROR,
    });
    render(
      wrapInIntlProvider(
        wrapInClassroom(
          <QueryClientProvider client={queryClient}>
            <DocumentRow
              onRetryFailedUpload={mockedOnRetryFailedUpload}
              document={document}
            />
          </QueryClientProvider>,
          classroom,
        ),
      ),
    );
    expect(screen.getByText('my_document.pdf')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Click on this button to retry uploading your failed upload.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: 'Click to set as default document' }),
    ).not.toBeInTheDocument();
  });
});
