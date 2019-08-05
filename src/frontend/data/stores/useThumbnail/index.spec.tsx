import { render } from '@testing-library/react';
import React from 'react';

import { useThumbnail, useThumbnailApi } from '.';
import { modelName } from '../../../types/models';

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

    const state = getLatestHookValues();

    expect(state[modelName.THUMBNAIL]).toEqual({
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
    expect(state.getThumbnail()).toEqual({
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
  it('adds a resource to the store', () => {
    useThumbnailApi.getState().addResource({ id: 'newResource' } as any);

    expect(useThumbnailApi.getState()[modelName.THUMBNAIL].newResource).toEqual(
      { id: 'newResource' },
    );
  });
  it('removes an existing resource', () => {
    useThumbnailApi.getState().addResource({ id: 'toDelete' } as any);

    expect(useThumbnailApi.getState()[modelName.THUMBNAIL].toDelete).toEqual({
      id: 'toDelete',
    });

    useThumbnailApi.getState().removeResource({ id: 'toDelete' } as any);

    expect(
      useThumbnailApi.getState()[modelName.THUMBNAIL].toDelete,
    ).toBeUndefined();
  });
  it('adds multiple resources to the store', () => {
    useThumbnailApi
      .getState()
      .addMultipleResources([
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

    expect(useThumbnailApi.getState()[modelName.THUMBNAIL].multi1).toEqual({
      id: 'multi1',
    });
    expect(useThumbnailApi.getState()[modelName.THUMBNAIL].multi2).toEqual({
      id: 'multi2',
    });
    expect(useThumbnailApi.getState()[modelName.THUMBNAIL].multi3).toEqual({
      id: 'multi3',
    });
  });
});
