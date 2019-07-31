import { render } from '@testing-library/react';
import React from 'react';

import { useTimedTextTrack } from '.';

jest.mock('../../appData', () => ({
  appData: {
    video: {
      timed_text_tracks: [
        {
          active_stamp: 1549385921,
          id: 'ttt-1',
          is_ready_to_play: true,
          language: 'fr',
          mode: 'st',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-1.vtt',
        },
        {
          active_stamp: 1549385922,
          id: 'ttt-2',
          is_ready_to_play: false,
          language: 'fr',
          mode: 'st',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-2.vtt',
        },
        {
          active_stamp: 1549385923,
          id: 'ttt-3',
          is_ready_to_play: true,
          language: 'en',
          mode: 'cc',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-3.vtt',
        },
        {
          active_stamp: 1549385924,
          id: 'ttt-4',
          is_ready_to_play: true,
          language: 'fr',
          mode: 'ts',
          upload_state: 'ready',
          url: 'https://example.com/timedtext/ttt-4.vtt',
        },
      ],
    },
  },
}));

describe('stores/useTimedTextTrack', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = () => {
    const hookValues = useTimedTextTrack();
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  it('parses appData to found timed text track in video data', () => {
    render(<TestComponent />);

    const { timedTextTracks, getTimedTextTracks } = getLatestHookValues();

    expect(timedTextTracks).toEqual({
      'ttt-1': {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_play: true,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      'ttt-2': {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_play: false,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      'ttt-3': {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_play: true,
        language: 'en',
        mode: 'cc',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      'ttt-4': {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_play: true,
        language: 'fr',
        mode: 'ts',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-4.vtt',
      },
    });
    expect(getTimedTextTracks()).toEqual([
      {
        active_stamp: 1549385921,
        id: 'ttt-1',
        is_ready_to_play: true,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-1.vtt',
      },
      {
        active_stamp: 1549385922,
        id: 'ttt-2',
        is_ready_to_play: false,
        language: 'fr',
        mode: 'st',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-2.vtt',
      },
      {
        active_stamp: 1549385923,
        id: 'ttt-3',
        is_ready_to_play: true,
        language: 'en',
        mode: 'cc',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-3.vtt',
      },
      {
        active_stamp: 1549385924,
        id: 'ttt-4',
        is_ready_to_play: true,
        language: 'fr',
        mode: 'ts',
        upload_state: 'ready',
        url: 'https://example.com/timedtext/ttt-4.vtt',
      },
    ]);
  });
});
