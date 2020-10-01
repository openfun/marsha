import { render } from '@testing-library/react';
import React from 'react';

import { useThumbnail } from '.';
import { modelName } from '../../../types/models';

jest.mock('../../appData', () => ({
  appData: {
    video: {
      thumbnail: {
        active_stamp: '1564494507',
        id: 'c0ea0fbc-5ce1-4340-a589-3db01d804045',
        is_ready_to_show: true,
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

    const state = getLatestHookValues();

    expect(state[modelName.THUMBNAILS]).toEqual({
      'c0ea0fbc-5ce1-4340-a589-3db01d804045': {
        active_stamp: '1564494507',
        id: 'c0ea0fbc-5ce1-4340-a589-3db01d804045',
        is_ready_to_show: true,
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
    expect(state.getThumbnail()).toEqual({
      active_stamp: '1564494507',
      id: 'c0ea0fbc-5ce1-4340-a589-3db01d804045',
      is_ready_to_show: true,
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

  it('returns null when there is no thumbnail', () => {
    useThumbnail.setState({
      [modelName.THUMBNAILS]: {},
    });

    expect(useThumbnail.getState().getThumbnail()).toBeNull();
  });

  it('adds a resource to the store', () => {
    useThumbnail.getState().addResource({ id: 'newResource' } as any);

    expect(useThumbnail.getState()[modelName.THUMBNAILS].newResource).toEqual({
      id: 'newResource',
    });
  });

  it('removes an existing resource', () => {
    useThumbnail.getState().addResource({ id: 'toDelete' } as any);

    expect(useThumbnail.getState()[modelName.THUMBNAILS].toDelete).toEqual({
      id: 'toDelete',
    });

    useThumbnail.getState().removeResource({ id: 'toDelete' } as any);

    expect(
      useThumbnail.getState()[modelName.THUMBNAILS].toDelete,
    ).toBeUndefined();
  });

  it('adds multiple resources to the store', () => {
    useThumbnail
      .getState()
      .addMultipleResources([
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

    expect(useThumbnail.getState()[modelName.THUMBNAILS].multi1).toEqual({
      id: 'multi1',
    });
    expect(useThumbnail.getState()[modelName.THUMBNAILS].multi2).toEqual({
      id: 'multi2',
    });
    expect(useThumbnail.getState()[modelName.THUMBNAILS].multi3).toEqual({
      id: 'multi3',
    });
  });
});
