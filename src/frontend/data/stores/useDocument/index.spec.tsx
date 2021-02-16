import { ModelName } from '../../../types/models';
import { useDocument } from '.';

jest.mock('../../appData', () => ({
  appData: {
    document: {
      id: 'doc1',
    },
  },
}));

describe('stores/useDocument', () => {
  it('parses appData to found document element', () => {
    const state = useDocument.getState();

    expect(state[ModelName.DOCUMENTS]).toEqual({
      doc1: {
        id: 'doc1',
      },
    });
    expect(state.getDocument({ id: 'doc1' } as any)).toEqual({ id: 'doc1' });
  });
  it('adds a resource to the store', () => {
    useDocument.getState().addResource({ id: 'newResource' } as any);

    expect(useDocument.getState()[ModelName.DOCUMENTS].newResource).toEqual({
      id: 'newResource',
    });
  });
  it('removes an existing resource', () => {
    useDocument.getState().addResource({ id: 'toDelete' } as any);

    expect(useDocument.getState()[ModelName.DOCUMENTS].toDelete).toEqual({
      id: 'toDelete',
    });

    useDocument.getState().removeResource({ id: 'toDelete' } as any);

    expect(
      useDocument.getState()[ModelName.DOCUMENTS].toDelete,
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

    expect(useDocument.getState()[ModelName.DOCUMENTS].multi1).toEqual({
      id: 'multi1',
    });
    expect(useDocument.getState()[ModelName.DOCUMENTS].multi2).toEqual({
      id: 'multi2',
    });
    expect(useDocument.getState()[ModelName.DOCUMENTS].multi3).toEqual({
      id: 'multi3',
    });
  });
});
