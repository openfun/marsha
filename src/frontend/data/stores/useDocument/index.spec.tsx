import { modelName } from '../../../types/models';
import { useDocumentApi } from './';

jest.mock('../../appData', () => ({
  appData: {
    document: {
      id: 'doc1',
    },
  },
}));

describe('stores/useDocument', () => {
  it('parses appData to found document element', () => {
    const state = useDocumentApi.getState();

    expect(state[modelName.DOCUMENTS]).toEqual({
      doc1: {
        id: 'doc1',
      },
    });
    expect(state.getDocument({ id: 'doc1' } as any)).toEqual({ id: 'doc1' });
  });
  it('adds a resource to the store', () => {
    useDocumentApi.getState().addResource({ id: 'newResource' } as any);

    expect(useDocumentApi.getState()[modelName.DOCUMENTS].newResource).toEqual({
      id: 'newResource',
    });
  });
  it('removes an existing resource', () => {
    useDocumentApi.getState().addResource({ id: 'toDelete' } as any);

    expect(useDocumentApi.getState()[modelName.DOCUMENTS].toDelete).toEqual({
      id: 'toDelete',
    });

    useDocumentApi.getState().removeResource({ id: 'toDelete' } as any);

    expect(
      useDocumentApi.getState()[modelName.DOCUMENTS].toDelete,
    ).toBeUndefined();
  });
  it('adds multiple resources to the store', () => {
    useDocumentApi
      .getState()
      .addMultipleResources([
        { id: 'multi1' } as any,
        { id: 'multi2' } as any,
        { id: 'multi3' } as any,
      ]);

    expect(useDocumentApi.getState()[modelName.DOCUMENTS].multi1).toEqual({
      id: 'multi1',
    });
    expect(useDocumentApi.getState()[modelName.DOCUMENTS].multi2).toEqual({
      id: 'multi2',
    });
    expect(useDocumentApi.getState()[modelName.DOCUMENTS].multi3).toEqual({
      id: 'multi3',
    });
  });
});
