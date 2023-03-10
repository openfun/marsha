import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from 'utils/wrapInVideo';

import { UploadSubtitles } from '.';

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
];

describe('<UploadSubtitles />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'some token',
      getDecodedJwt: () => ({ locale: 'fr_FR' } as any),
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the UploadSubtitles', () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
      {
        actions: { POST: { language: { choices: languageChoices } } },
      },
      { method: 'OPTIONS' },
    );
    const mockedVideo = videoMockFactory();

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
