import { act, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  Playlist,
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  uploadState,
  useJwt,
} from 'lib-components';
import { documentMockFactory } from 'lib-components/tests';
import { Deferred, render } from 'lib-tests';

import DashboardDocument from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    document: null,
  }),
}));

describe('<DashboardDocument />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useJwt.setState({
      jwt: 'cool_token_m8',
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('starts polling when the document is in pending, uploading and processing', async () => {
    let deferred = new Deferred();
    const document = documentMockFactory({
      id: '44',
      is_ready_to_show: true,
      upload_state: uploadState.PROCESSING,
    });

    fetchMock.mock('/api/documents/44/', deferred.promise);

    render(<DashboardDocument document={document} />);
    screen.getByText('Processing');
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the document is still processing
    jest.advanceTimersByTime(1000 * 10 + 200);

    act(() =>
      deferred.resolve(
        JSON.stringify({
          ...document,
          is_ready_to_show: false,
          upload_state: uploadState.PROCESSING,
        }),
      ),
    );

    await waitFor(() =>
      expect(fetchMock.lastCall()![0]).toEqual('/api/documents/44/'),
    );
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
      'Accept-Language': 'en',
    });
    screen.getByText('Processing');

    // The document will be ready in further responses
    fetchMock.restore();
    deferred = new Deferred();
    fetchMock.mock('/api/documents/44/', deferred.promise);

    act(() =>
      deferred.resolve(
        JSON.stringify({
          ...document,
          is_ready_to_show: true,
          upload_state: uploadState.READY,
        }),
      ),
    );

    /**
     * https://github.com/testing-library/react-hooks-testing-library/issues/631
     * jest.advanceTimersToNextTimer advances as well the `waitFor` timeout.
     * So we have to make a timeout bigger that the one in poolForTrack
     */
    await waitFor(
      () => {
        expect(fetchMock.lastCall()).toBeDefined();

        if (fetchMock.lastCall() === undefined) {
          jest.advanceTimersToNextTimer();
        }
      },
      {
        timeout: 1000 * 30 * 3,
        interval: 1000 * 30,
      },
    );
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
      'Accept-Language': 'en',
    });

    expect(
      screen.getByText((content) => content.startsWith('Ready')),
    ).toBeInTheDocument();
  });

  it('shows the upload button in pending state', () => {
    render(
      <DashboardDocument
        document={documentMockFactory({
          id: '45',
          is_ready_to_show: true,
          upload_state: uploadState.PENDING,
        })}
      />,
    );

    expect(screen.getByText('Upload a document')).toBeInTheDocument();
  });

  it('shows the replace button in error state', () => {
    render(
      <DashboardDocument
        document={documentMockFactory({
          id: '45',
          upload_state: uploadState.ERROR,
          is_ready_to_show: true,
        })}
      />,
    );

    screen.getByText((content) => content.startsWith('Error'));
    expect(
      screen.getByRole('button', { name: /Replace the document/i }),
    ).toBeInTheDocument();
  });

  it('renders in ready state', () => {
    const playlist = {
      title: 'foo',
      lti_id: 'foo+context_id',
    } as Playlist;
    render(
      <DashboardDocument
        document={documentMockFactory({
          id: '45',
          is_ready_to_show: true,
          upload_state: uploadState.READY,
          title: 'foo',
          playlist,
        })}
      />,
    );

    // document state
    screen.getByText((content) => content.startsWith('Ready'));

    // document filename
    screen.getByText(/Filename/i);
    screen.getByText('bar_foo.pdf');

    // Buttons
    screen.getByText('Replace the document');
    screen.getByText('Display');

    // show the player
    screen.getByText('foo');
    expect(screen.getByRole('img')).toHaveClass('icon-file-text2');
  });

  it('shows the progress bar when the document is uploading', () => {
    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            45: {
              file: new File(['(⌐□_□)'], 'document.pdf'),
              objectId: '45',
              objectType: modelName.DOCUMENTS,
              progress: 0,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        <DashboardDocument
          document={documentMockFactory({
            id: '45',
            upload_state: uploadState.PENDING,
          })}
        />
      </UploadManagerContext.Provider>,
    );

    screen.getByText('Uploading');
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
