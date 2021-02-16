import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Grommet } from 'grommet';
import React from 'react';

import DashboardDocument from '.';
import { UploadState } from '../../types/tracks';
import { Deferred } from '../../utils/tests/Deferred';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { documentMockFactory } from '../../utils/tests/factories';
import { wrapInRouter } from '../../utils/tests/router';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('../../data/appData', () => ({
  appData: {
    document: null,
    jwt: 'cool_token_m8',
  },
}));

describe('<DashboardDocument />', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => fetchMock.restore());
  afterEach(jest.resetAllMocks);

  it('starts polling when the document is in pending, uploading and processing', async () => {
    let deferred = new Deferred();
    const document = documentMockFactory({
      id: '44',
      is_ready_to_show: true,
      upload_state: UploadState.PROCESSING,
    });

    fetchMock.mock('/api/documents/44/', deferred.promise);

    // wrap the component in a grommet provider to have a valid theme.
    // Without it, the FormField component fail to render because it is a composed
    // component using property in the theme.
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <DashboardDocument document={document} />
          </Grommet>,
        ),
      ),
    );
    screen.getByText('Processing');
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the document is still processing
    jest.advanceTimersByTime(1000 * 10 + 200);

    await act(async () =>
      deferred.resolve(
        JSON.stringify({
          ...document,
          is_ready_to_show: false,
          upload_state: UploadState.PROCESSING,
        }),
      ),
    );

    expect(fetchMock.lastCall()![0]).toEqual('/api/documents/44/');
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });
    screen.getByText('Processing');

    // The document will be ready in further responses
    fetchMock.restore();
    deferred = new Deferred();
    fetchMock.mock('/api/documents/44/', deferred.promise);

    // Second backend call
    jest.advanceTimersByTime(1000 * 30 + 200);
    await act(async () =>
      deferred.resolve(
        JSON.stringify({
          ...document,
          is_ready_to_show: true,
          upload_state: UploadState.READY,
        }),
      ),
    );

    expect(fetchMock.lastCall()![0]).toEqual('/api/documents/44/');
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    screen.getByText((content) => content.startsWith('Ready'));
  });

  it('shows the upload button in pending state', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardDocument
            document={documentMockFactory({
              id: '45',
              is_ready_to_show: true,
              upload_state: UploadState.PENDING,
            })}
          />,
        ),
      ),
    );

    screen.getByText('Upload a document');
  });

  it('shows the replace button in error state', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardDocument
            document={documentMockFactory({
              id: '45',
              upload_state: UploadState.ERROR,
              is_ready_to_show: true,
            })}
          />,
        ),
      ),
    );

    screen.getByText((content) => content.startsWith('Error'));
    screen.getByRole('button', { name: /Replace the document/i });
  });

  it('renders in ready state', () => {
    // wrap the component in a grommet provider to have a valid theme.
    // Without it, the FormField component fail to render because it is a composed
    // component using property in the theme.
    const { getByText, container } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <Grommet>
            <DashboardDocument
              document={documentMockFactory({
                id: '45',
                is_ready_to_show: true,
                upload_state: UploadState.READY,
                title: 'foo',
                playlist: {
                  title: 'foo',
                  lti_id: 'foo+context_id',
                },
              })}
            />
          </Grommet>,
        ),
      ),
    );

    // document state
    getByText((content) => content.startsWith('Ready'));

    // document filename
    getByText('Filename');
    getByText('bar_foo.pdf');

    // Buttons
    getByText('Replace the document');
    getByText('Display');

    // show the player
    getByText('foo');
    expect(container.getElementsByClassName('icon-file-text2')).toHaveLength(1);
  });

  it('shows the progress bar when the document is uploading', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardDocument
            document={documentMockFactory({
              id: '45',
              upload_state: UploadState.UPLOADING,
            })}
          />,
        ),
      ),
    );

    screen.getByText('Uploading');
    screen.getByText('0%');
  });
});
