import { render } from '@testing-library/react';
import React from 'react';

import { useThumbnail } from '.';

jest.mock('../../appData', () => ({
  appData: {
    video: {
      thumbnail: {
        active_stamp: '1564494507',
        id: 'c0ea0fbc-5ce1-4340-a589-3db01d804045',
        is_ready_to_display: true,
        upload_state: 'ready',
        urls: {
          144: 'https://example.com/144.jpg',
          240: 'https://example.com/240.jpg',
          480: 'https://example.com/480.jpg',
          720: 'https://example.com/720.jpg',
          1080: 'https://example.com/1080.jpg',
        },
        video: 'd9583272-dcb5-44f3-998f-59797e613754',
      },
    },
  },
}));

describe('stores/useThumbnail', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValues: any;
  const TestComponent = () => {
    const hookValues = useThumbnail();
    getLatestHookValues = () => hookValues;
    return <div />;
  };

  it('parses appData to found thumbnail in video data', () => {
    render(<TestComponent />);

    const { thumbnails, getThumbnail } = getLatestHookValues();

    expect(thumbnails).toEqual({
      'c0ea0fbc-5ce1-4340-a589-3db01d804045': {
        active_stamp: '1564494507',
        id: 'c0ea0fbc-5ce1-4340-a589-3db01d804045',
        is_ready_to_display: true,
        upload_state: 'ready',
        urls: {
          144: 'https://example.com/144.jpg',
          240: 'https://example.com/240.jpg',
          480: 'https://example.com/480.jpg',
          720: 'https://example.com/720.jpg',
          1080: 'https://example.com/1080.jpg',
        },
        video: 'd9583272-dcb5-44f3-998f-59797e613754',
      },
    });
    expect(getThumbnail()).toEqual({
      active_stamp: '1564494507',
      id: 'c0ea0fbc-5ce1-4340-a589-3db01d804045',
      is_ready_to_display: true,
      upload_state: 'ready',
      urls: {
        144: 'https://example.com/144.jpg',
        240: 'https://example.com/240.jpg',
        480: 'https://example.com/480.jpg',
        720: 'https://example.com/720.jpg',
        1080: 'https://example.com/1080.jpg',
      },
      video: 'd9583272-dcb5-44f3-998f-59797e613754',
    });
  });
});
