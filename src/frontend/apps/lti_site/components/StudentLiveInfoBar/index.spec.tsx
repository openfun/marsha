import { getDefaultNormalizer, screen } from '@testing-library/react';
import React from 'react';

import { imageSnapshot } from 'utils/tests/imageSnapshot';
import render from 'utils/tests/render';

import { StudentLiveInfoBar } from '.';
import { videoMockFactory } from 'lib-components';
import { wrapInVideo } from '../../utils/tests/wrapInVideo';

describe('<StudentLiveInfoBar />', () => {
  it('renders live title', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(wrapInVideo(<StudentLiveInfoBar startDate={null} />, mockedVideo), {
      intlOptions: { locale: 'fr' },
    });

    screen.getByRole('heading', { name: 'title' });
  });

  it('renders live title and live start datetime [screenshot]', async () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: 'title',
    });

    render(
      wrapInVideo(
        <StudentLiveInfoBar startDate={'2022-09-26T07:00:00Z'} />,
        mockedVideo,
      ),
      {
        intlOptions: { locale: 'en' },
      },
    );

    screen.getByRole('heading', { name: 'title' });
    screen.getByText('9/26/2022  ·  7:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });

    await imageSnapshot();
  });
});
