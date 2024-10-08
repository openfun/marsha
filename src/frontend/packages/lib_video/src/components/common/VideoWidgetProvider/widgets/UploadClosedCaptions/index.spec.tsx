import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider, useJwt } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { UploadClosedCaptions } from '.';

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

describe('<UploadClosedCaptions />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () => ({ locale: 'en_US' }) as any,
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the UploadClosedCaptions', async () => {
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
          <UploadClosedCaptions />
        </InfoWidgetModalProvider>,
        mockedVideo,
      ),
    );

    expect(await screen.findByText('Closed captions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'help' })).toBeInTheDocument();
  });
});
