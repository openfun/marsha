import { modelName } from '@lib-components/types/models';

import { useDocument } from '.';

describe('stores/useDocument', () => {
  it('adds a resource to the store', () => {
    useDocument.getState().addResource({ id: 'newResource' } as any);

    expect(useDocument.getState()[modelName.DOCUMENTS].newResource).toEqual({
      id: 'newResource',
    });
  });

  it('removes an existing resource', () => {
    useDocument.getState().addResource({ id: 'toDelete' } as any);

    expect(useDocument.getState()[modelName.DOCUMENTS].toDelete).toEqual({
      id: 'toDelete',
    });

    useDocument.getState().removeResource({ id: 'toDelete' } as any);

    expect(
      useDocument.getState()[modelName.DOCUMENTS].toDelete,
    ).toBeUndefined();
  });

  it('adds multiple resources to the store', () => {
    useDocument
      .getState()
      .addMultipleResources([
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

    expect(useDocument.getState()[modelName.DOCUMENTS].multi1).toEqual({
      id: 'multi1',
    });
    expect(useDocument.getState()[modelName.DOCUMENTS].multi2).toEqual({
      id: 'multi2',
    });
    expect(useDocument.getState()[modelName.DOCUMENTS].multi3).toEqual({
      id: 'multi3',
    });
  });
});
