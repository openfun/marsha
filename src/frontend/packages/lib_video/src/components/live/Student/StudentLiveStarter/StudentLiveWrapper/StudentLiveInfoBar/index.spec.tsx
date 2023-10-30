import { getDefaultNormalizer, screen } from '@testing-library/react';
import { videoMockFactory } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { StudentLiveInfoBar } from '.';

describe('<StudentLiveInfoBar />', () => {
  it('renders live title', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(wrapInVideo(<StudentLiveInfoBar startDate={null} />, mockedVideo), {
      intlOptions: { locale: 'fr' },
    });

    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
  });

  it('renders live title and live start datetime', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <StudentLiveInfoBar startDate="2022-09-26T07:00:00Z" />,
        mockedVideo,
      ),
      {
        intlOptions: { locale: 'en' },
      },
    );

    expect(screen.getByRole('heading', { name: 'title' })).toBeInTheDocument();
    expect(
      screen.getByText('9/26/2022  ·  7:00:00 AM', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
  });
});
