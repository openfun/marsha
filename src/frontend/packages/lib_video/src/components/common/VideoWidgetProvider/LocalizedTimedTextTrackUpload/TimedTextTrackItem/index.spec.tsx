import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  useJwt,
  timedTextMockFactory,
  UploadingObject,
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  uploadState,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { DeleteTimedTextTrackUploadModalProvider } from '@lib-video/hooks/useDeleteTimedTextTrackUploadModal';

import { TimedTextTrackItem } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Swedish', value: 'sv' },
];

const mockedOnRetryFailedUpload = jest.fn();

describe('<TimedTextTrackItem />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the component for a correctly uploaded timed text track', async () => {
    const mockedTimedTextTrack = timedTextMockFactory({ language: 'fr-FR' });

    render(
      <DeleteTimedTextTrackUploadModalProvider value={null}>
        <TimedTextTrackItem
          onRetryFailedUpload={mockedOnRetryFailedUpload}
          timedTextTrack={mockedTimedTextTrack}
          choices={languageChoices}
        />
      </DeleteTimedTextTrackUploadModalProvider>,
    );

    await screen.findByText('French');
    screen.getByRole('button', {
      name: 'Click on this button to delete the timed text track.',
    });
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to retry uploading your failed upload.',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the component for an uploading timed text track', async () => {
    const mockedTimedTextTrack = timedTextMockFactory({
      language: 'fr-FR',
      upload_state: uploadState.PENDING,
    });

    const mockedUploadingObject: UploadingObject = {
      file: new File([], 'subtitle.srt'),
      objectType: modelName.TIMEDTEXTTRACKS,
      objectId: mockedTimedTextTrack.id,
      progress: 50,
      status: UploadManagerStatus.UPLOADING,
    };

    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [mockedTimedTextTrack.id]: mockedUploadingObject,
          },
        }}
      >
        <DeleteTimedTextTrackUploadModalProvider value={null}>
          <TimedTextTrackItem
            onRetryFailedUpload={mockedOnRetryFailedUpload}
            timedTextTrack={mockedTimedTextTrack}
            uploadingObject={mockedUploadingObject}
            choices={languageChoices}
          />
        </DeleteTimedTextTrackUploadModalProvider>
      </UploadManagerContext.Provider>,
    );

    await screen.findByText('French');
    screen.getByRole('button', {
      name: 'Click on this button to delete the timed text track.',
    });
    screen.getByText('Uploading');
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to retry uploading your failed upload.',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the component for a processing timed text track', async () => {
    const mockedTimedTextTrack = timedTextMockFactory({
      language: 'fr-FR',
      upload_state: uploadState.PROCESSING,
    });

    const mockedUploadingObject: UploadingObject = {
      file: new File([], 'subtitle.srt'),
      objectType: modelName.TIMEDTEXTTRACKS,
      objectId: mockedTimedTextTrack.id,
      progress: 100,
      status: UploadManagerStatus.SUCCESS,
    };

    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {
            [mockedTimedTextTrack.id]: mockedUploadingObject,
          },
        }}
      >
        <DeleteTimedTextTrackUploadModalProvider value={null}>
          <TimedTextTrackItem
            onRetryFailedUpload={mockedOnRetryFailedUpload}
            timedTextTrack={mockedTimedTextTrack}
            uploadingObject={mockedUploadingObject}
            choices={languageChoices}
          />
        </DeleteTimedTextTrackUploadModalProvider>
      </UploadManagerContext.Provider>,
    );

    await screen.findByText('French');
    screen.getByRole('button', {
      name: 'Click on this button to delete the timed text track.',
    });
    screen.getByText('Processing');
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to retry uploading your failed upload.',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the component for a failed timed text track and retries it', async () => {
    const mockedTimedTextTrack = timedTextMockFactory({
      language: 'fr-FR',
      upload_state: uploadState.PENDING,
    });

    render(
      <DeleteTimedTextTrackUploadModalProvider value={null}>
        <TimedTextTrackItem
          onRetryFailedUpload={mockedOnRetryFailedUpload}
          timedTextTrack={mockedTimedTextTrack}
          choices={languageChoices}
        />
      </DeleteTimedTextTrackUploadModalProvider>,
    );

    await screen.findByText('French');
    screen.getByRole('button', {
      name: 'Click on this button to delete the timed text track.',
    });
    const retryButton = screen.getByRole('button', {
      name: 'Click on this button to retry uploading your failed upload.',
    });
    userEvent.click(retryButton);
    expect(mockedOnRetryFailedUpload).toHaveBeenCalledWith(
      mockedTimedTextTrack.id,
    );
  });

  it('renders the component for a timed text track with an unrecognized language', () => {
    const mockedTimedTextTrack = timedTextMockFactory({
      language: 'fr-FR',
    });

    render(
      <DeleteTimedTextTrackUploadModalProvider value={null}>
        <TimedTextTrackItem
          onRetryFailedUpload={mockedOnRetryFailedUpload}
          timedTextTrack={mockedTimedTextTrack}
        />
      </DeleteTimedTextTrackUploadModalProvider>,
    );
    screen.getByRole('button', {
      name: 'Click on this button to delete the timed text track.',
    });
    screen.getByText('Unrecognized language');
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to retry uploading your failed upload.',
      }),
    ).not.toBeInTheDocument();
  });

  it('downloads transcript when the teacher clicks on language title', async () => {
    const transcriptContent = `WEBVTT
    1
    00:00:00.600 --> 00:00:02.240 
    -Bonjour. Bonjour à tous.

    2
    00:00:02.560 --> 00:00:05.280
    Bienvenue dans ce nouveau MOOC
    "Du manager au leader".`;

    const mockedTimedTextTrack = timedTextMockFactory({
      language: 'fr-FR',
      source_url: 'https://example.com/vtt/fr.vtt',
    });

    fetchMock.mock('https://example.com/vtt/fr.vtt', transcriptContent);

    render(
      <DeleteTimedTextTrackUploadModalProvider value={null}>
        <TimedTextTrackItem
          onRetryFailedUpload={mockedOnRetryFailedUpload}
          timedTextTrack={mockedTimedTextTrack}
        />
      </DeleteTimedTextTrackUploadModalProvider>,
    );

    const downloadAnchor = await screen.findByRole('link');
    expect(downloadAnchor).toHaveAttribute(
      'href',
      'https://example.com/vtt/fr.vtt',
    );

    fireEvent.click(downloadAnchor);
  });
});
