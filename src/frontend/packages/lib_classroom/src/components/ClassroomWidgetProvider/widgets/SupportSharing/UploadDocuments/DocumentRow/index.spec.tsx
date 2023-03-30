import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { uploadState, useJwt } from 'lib-components';
import { wrapInIntlProvider } from 'lib-tests';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import {
  classroomDocumentMockFactory,
  classroomMockFactory,
} from '@lib-classroom/utils/tests/factories';
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
      classroom: classroom,
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
      screen.getByRole('button', { name: 'Click to set as default document' }),
    ).toBeEnabled();
  });

  it('renders a row in UPLOAD_IN_PROGRESS state', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const document = classroomDocumentMockFactory({
      filename: 'my_document.pdf',
      classroom: classroom,
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
      screen.getByRole('button', { name: 'Click to set as default document' }),
    ).toBeDisabled();
  });

  it('renders a row in FAILED state', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const document = classroomDocumentMockFactory({
      filename: 'my_document.pdf',
      classroom: classroom,
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
      screen.getByRole('button', { name: 'Click to set as default document' }),
    ).toBeDisabled();
  });
});
