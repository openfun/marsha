import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  useJwt,
  videoMockFactory,
  InfoWidgetModalProvider,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

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
      getDecodedJwt: () => ({ locale: 'fr_FR' } as any),
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the UploadTranscripts', () => {
    fetchMock.mock(
      '/api/timedtexttracks/',
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
        videoMockFactory(),
      ),
    );

    expect(screen.getByText('Transcripts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'help' })).toBeInTheDocument();
  });
});
