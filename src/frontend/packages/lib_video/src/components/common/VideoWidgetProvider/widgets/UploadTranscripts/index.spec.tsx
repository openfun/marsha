import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider, useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { UploadTranscripts } from '.';

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
];

describe('<UploadTranscripts />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'fr_FR' }) as any,
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the UploadTranscripts', async () => {
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
          <UploadTranscripts />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(await screen.findByText('Transcripts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'help' })).toBeInTheDocument();
  });
});
