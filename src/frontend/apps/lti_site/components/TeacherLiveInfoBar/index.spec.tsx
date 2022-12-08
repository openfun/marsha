import { getDefaultNormalizer, screen } from '@testing-library/react';
import { videoMockFactory } from 'lib-components';
import React from 'react';

import render from 'utils/tests/render';
import { wrapInVideo } from 'utils/tests/wrapInVideo';

import { TeacherLiveInfoBar } from '.';

describe('<TeacherLiveInfoBar />', () => {
  it('renders title and startDate', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: undefined,
    });

    render(
      wrapInVideo(
        <TeacherLiveInfoBar startDate={'2022-09-26T07:00:00Z'} />,
        mockedVideo,
      ),
      {
        intlOptions: { locale: 'en' },
      },
    );

    screen.getByDisplayValue('No title');
    screen.getByText('9/26/2022  ·  7:00:00 AM', {
      normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
    });
  });
});
