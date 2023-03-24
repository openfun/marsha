import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useJwt,
  videoMockFactory,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { UploadClosedCaptions } from '.';

const languageChoices = [
  { display_name: 'English', value: 'en' },
  { display_name: 'French', value: 'fr' },
];

describe('<UploadClosedCaptions />', () => {
  beforeEach(() => {
    useJwt.setState({
      getDecodedJwt: () => ({ locale: 'en_US' } as any),
    });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('renders the UploadClosedCaptions', () => {
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
          <UploadClosedCaptions />
        </InfoWidgetModalProvider>,
        videoMockFactory(),
      ),
    );

    expect(screen.getByText('Closed captions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'help' })).toBeInTheDocument();
  });
});
