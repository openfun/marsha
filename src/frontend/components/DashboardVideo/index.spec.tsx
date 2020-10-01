import { render } from '@testing-library/react';
import React from 'react';

import { uploadState, Video } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import DashboardVideo from './';

jest.mock('../DashboardVideoPane', () => ({
  DashboardVideoPane: (props: { video: Video }) => (
    <span title={props.video.id} />
  ),
}));
jest.mock('../DashboardTimedTextPane', () => ({
  DashboardTimedTextPane: () => '',
}));
jest.mock('../../data/appData', () => ({
  appData: {
    video: {
      id: 'dd44',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: 'processing',
    },
  },
}));

describe('<DashboardVideo />', () => {
  it('renders', () => {
    const mockVideo = videoMockFactory({
      id: 'dd44',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    });

    const { getByTitle } = render(
      wrapInIntlProvider(<DashboardVideo video={mockVideo} />),
    );
    getByTitle('dd44');
  });

  it('defaults to the video from props', () => {
    const videoProps = videoMockFactory({
      id: 'dd43',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    });
    const { getByTitle } = render(
      wrapInIntlProvider(<DashboardVideo video={videoProps} />),
    );
    getByTitle('dd43');
  });
});
