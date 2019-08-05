import { render } from '@testing-library/react';
import React from 'react';

import { uploadState } from '../../types/tracks';
import { wrapInRouter } from '../../utils/tests/router';

import { InstructorView } from './';

jest.mock('jwt-decode', () => jest.fn());

let mockDecodedJwt: any;
jest.mock('../../data/appData', () => ({
  getDecodedJwt: () => mockDecodedJwt,
}));

describe('<InstructorView />', () => {
  it('renders the instructor controls', () => {
    mockDecodedJwt = {
      read_only: false,
    };
    const mockVideo: any = {
      id: 42,
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    };
    const state = {
      jwt: {
        read_only: false,
      },
      video: mockVideo,
    } as any;

    const { getByText } = render(
      wrapInRouter(
        <InstructorView>
          <div className="some-child" />
        </InstructorView>,
      ),
    );

    getByText('Instructor Preview 👆');
    getByText('Go to Dashboard');
  });

  it('remove the button when read_only is true', () => {
    mockDecodedJwt = {
      read_only: true,
    };
    const mockVideo: any = {
      id: 42,
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: uploadState.PROCESSING,
    };
    const state = {
      jwt: {
        read_only: true,
      },
      video: mockVideo,
    } as any;

    const { getByText, queryByText } = render(
      wrapInRouter(
        <InstructorView>
          <div className="some-child" />
        </InstructorView>,
      ),
    );

    getByText(
      'This video is imported from another playlist. You can go to the original playlist to directly modify this video, or delete it from the current playlist and replace it by a new video.',
    );
    expect(queryByText('Go to Dashboard')).toBeNull();
  });
});
