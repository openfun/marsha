import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider, useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { UploadSubtitles } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    flags: { transcription: false },
  }),
}));

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
];

describe('<UploadSubtitles />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'fr_FR' }) as any,
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the UploadSubtitles', () => {
    const mockedVideo = videoMockFactory();
    fetchMock.mock(
      `/api/videos/${mockedVideo.id}/timedtexttracks/`,
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );

    render(
      wrapInVideo(
        <InfoWidgetModalProvider value={null}>
          <UploadSubtitles />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(screen.getByText('Subtitles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'help' })).toBeInTheDocument();
  });
});
