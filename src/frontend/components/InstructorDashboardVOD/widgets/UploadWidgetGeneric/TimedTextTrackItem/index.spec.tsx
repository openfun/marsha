import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';

import {
  UploadingObject,
  UploadManagerContext,
  UploadManagerStatus,
} from 'components/UploadManager';
import { DeleteTimedTextTrackUploadModalProvider } from 'data/stores/useDeleteTimedTextTrackUploadModal';
import { useJwt } from 'data/stores/useJwt';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { timedTextMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';
import { TimedTextTrackItem } from '.';

jest.mock('utils/errors/report', () => ({ report: jest.fn() }));

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

  it('renders the component for a correctly uploaded timed text track', () => {
    const mockedTimedTextTrack = timedTextMockFactory({ language: 'fr-FR' });
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
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
    screen.getByText('French');
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to retry uploading your failed upload.',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the component for an uploading timed text track', () => {
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
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

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
          />
        </DeleteTimedTextTrackUploadModalProvider>
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('button', {
      name: 'Click on this button to delete the timed text track.',
    });
    screen.getByText('French');
    screen.getByText('Uploading');
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to retry uploading your failed upload.',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the component for a processing timed text track', () => {
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
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

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
          />
        </DeleteTimedTextTrackUploadModalProvider>
      </UploadManagerContext.Provider>,
    );

    screen.getByRole('button', {
      name: 'Click on this button to delete the timed text track.',
    });
    screen.getByText('French');
    screen.getByText('Processing');
    expect(
      screen.queryByRole('button', {
        name: 'Click on this button to retry uploading your failed upload.',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the component for a failed timed text track and retries it', () => {
    const mockedTimedTextTrack = timedTextMockFactory({
      language: 'fr-FR',
      upload_state: uploadState.PENDING,
    });
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
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
    screen.getByText('French');
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
    fetchMock.mock('/api/timedtexttracks/', 500, { method: 'OPTIONS' });

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
});
