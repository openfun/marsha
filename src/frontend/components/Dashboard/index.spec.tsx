import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { bootstrapStore } from '../../data/bootstrapStore';
import { uploadState, Video } from '../../types/tracks';
import { Dashboard } from './index';

jest.mock('../DashboardVideoPane', () => ({
  DashboardVideoPane: (props: { video: Video }) => (
    <span title={props.video.id} />
  ),
}));
jest.mock('../DashboardTimedTextPane', () => ({
  DashboardTimedTextPane: () => '',
}));

describe('<Dashboard />', () => {
  afterEach(cleanup);

  it('renders', () => {
    const mockVideo: any = {
      id: 'dd44',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    };
    const state = {
      video: mockVideo,
    } as any;
    const { getByText, getByTitle } = render(
      <Provider store={bootstrapStore(state)}>
        <Dashboard video={mockVideo} />
      </Provider>,
    );
    getByText('Dashboard');
    getByTitle('dd44');
  });

  it('defaults to the video from props', () => {
    const video: any = {
      id: 'dd44',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    };
    const state = {
      video,
    } as any;

    const videoProps: any = {
      id: 'dd43',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    };
    const { getByText, getByTitle } = render(
      <Provider store={bootstrapStore(state)}>
        <Dashboard video={videoProps} />
      </Provider>,
    );
    getByText('Dashboard');
    getByTitle('dd43');
  });
});
