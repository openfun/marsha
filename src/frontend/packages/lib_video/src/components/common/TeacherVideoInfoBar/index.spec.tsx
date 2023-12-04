import { getDefaultNormalizer, screen } from '@testing-library/react';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { TeacherVideoInfoBar } from '.';

describe('<TeacherVideoInfoBar />', () => {
  it('renders title and startDate', () => {
    const mockedVideo = videoMockFactory({
      allow_recording: false,
      title: undefined,
    });

    render(
      wrapInVideo(
        <TeacherVideoInfoBar startDate="2022-09-26T07:00:00Z" />,
        mockedVideo,
      ),
      {
        intlOptions: { locale: 'en' },
      },
    );

    expect(screen.getByDisplayValue('No title')).toBeInTheDocument();
    expect(
      screen.getByText('9/26/2022  ·  7:00:00 AM', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
  });
});
