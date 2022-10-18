import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useJwt, timedTextMockFactory } from 'lib-components';
import React, { PropsWithChildren } from 'react';

import {
  UploadingObject,
  UploadManagerContext,
  UploadManagerStatus,
  useUploadManager,
} from 'components/UploadManager';
import { DeleteTimedTextTrackUploadModalProvider } from 'data/stores/useDeleteTimedTextTrackUploadModal/index';
import { useTimedTextTrack } from 'data/stores/useTimedTextTrack';
import { useTimedTextTrackLanguageChoices } from 'data/stores/useTimedTextTrackLanguageChoices';
import { modelName } from 'lib-components';
import { timedTextMode, uploadState } from 'lib-components';
import render from 'utils/tests/render';

import { LocalizedTimedTextTrackUpload } from '.';

jest.mock('utils/errors/report', () => ({ report: jest.fn() }));

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

const languageChoices = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Swedish', value: 'sv' },
];

describe('<LocalizedTimedTextTrackUpload />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'jsonWebToken',
    });
  });

  it('renders the component without any uploaded timed text track', () => {
    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    render(
      <LocalizedTimedTextTrackUpload
        timedTextModeWidget={timedTextMode.SUBTITLE}
      />,
      { intlOptions: { locale: 'fr-FR' } },
    );

    screen.getByRole('button', {
      name: 'Select the language for which you want to upload a timed text file; Selected: fr',
    });
    expect(
      screen.getByRole('textbox', {
        name: 'Select the language for which you want to upload a timed text file, fr',
      }),
    ).toHaveValue('French');
    screen.getByText('No uploaded files');

    screen.getByRole('button', { name: 'Upload file' });
  });

  it('uploads a timed text track', async () => {
    const mockTimedTextTrack = {
      id: 'timedTextTrack_id',
      active_stamp: null,
      is_ready_to_show: false,
      language: 'fr',
      mode: timedTextMode.SUBTITLE,
      upload_state: uploadState,
      source_url: 'source_url',
      url: 'url',
      video: 'video_id',
    };
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    const mockAddUpload = jest.fn();
    mockUseUploadManager.mockReturnValue({
      addUpload: mockAddUpload,
      resetUpload: jest.fn(),
      uploadManagerState: {},
    });

    fetchMock.post('/api/timedtexttracks/', mockTimedTextTrack);

    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: () => {},
          uploadManagerState: {},
        }}
      >
        <LocalizedTimedTextTrackUpload
          timedTextModeWidget={timedTextMode.SUBTITLE}
        />
      </UploadManagerContext.Provider>,
      { intlOptions: { locale: 'fr-FR' } },
    );

    const uploadButton = screen.getByRole('button', { name: 'Upload file' });
    userEvent.click(uploadButton);
    const hiddenInput = screen.getByTestId('input-file-test-id');
    const file = new File(['(⌐□_□)'], 'subtitle.vtt', {
      type: '*',
    });
    userEvent.upload(hiddenInput, file);
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastCall()![0]).toEqual(`/api/timedtexttracks/`);
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        Authorization: 'Bearer jsonWebToken',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ language: 'fr', mode: 'st' }),
    });
    await waitFor(() =>
      expect(mockAddUpload).toHaveBeenCalledWith(
        modelName.TIMEDTEXTTRACKS,
        mockTimedTextTrack.id,
        file,
      ),
    );
  });

  it('renders the component with several uploaded and uploading timed text track', () => {
    useTimedTextTrackLanguageChoices.setState({
      choices: languageChoices,
    });

    const mockedTimedTextTrackUploading = timedTextMockFactory({
      language: 'fr-FR',
      upload_state: uploadState.PENDING,
    });

    const mockedUploadingObject: UploadingObject = {
      file: new File([], 'subtitle.srt'),
      objectType: modelName.TIMEDTEXTTRACKS,
      status: UploadManagerStatus.UPLOADING,
      objectId: mockedTimedTextTrackUploading.id,
      progress: 50,
    };

    mockUseUploadManager.mockReturnValue({
      addUpload: jest.fn(),
      resetUpload: jest.fn(),
      uploadManagerState: {
        [mockedTimedTextTrackUploading.id]: mockedUploadingObject,
      },
    });

    const mockedTimedTextTrackProcessing = timedTextMockFactory({
      language: 'en-EN',
      upload_state: uploadState.PROCESSING,
    });

    const mockedTimedTextTrackCompleted = timedTextMockFactory({
      language: 'es-ES',
    });

    useTimedTextTrack.getState().addResource(mockedTimedTextTrackUploading);
    useTimedTextTrack.getState().addResource(mockedTimedTextTrackProcessing);
    useTimedTextTrack.getState().addResource(mockedTimedTextTrackCompleted);

    render(
      <DeleteTimedTextTrackUploadModalProvider value={null}>
        <LocalizedTimedTextTrackUpload
          timedTextModeWidget={timedTextMode.SUBTITLE}
        />
        ,
      </DeleteTimedTextTrackUploadModalProvider>,
      { intlOptions: { locale: 'fr-FR' } },
    );

    screen.getByText('French');
    screen.getByText('Uploading');
    screen.getByText('English');
    screen.getByText('Processing');
    screen.getByText('Spanish');
    screen.getByText('Uploading');

    expect(
      screen.getAllByRole('button', {
        name: 'Click on this button to delete the timed text track.',
      }),
    ).toHaveLength(3);
  });
});
