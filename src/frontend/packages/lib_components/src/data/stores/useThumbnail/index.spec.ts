import { modelName } from '@lib-components/types/models';

import { useThumbnail } from '.';

describe('stores/useThumbnail', () => {
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
