import create from 'zustand';

import { Document } from '../../../types/file';
import { ModelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

type DocumentState = StoreState<Document> & {
  getDocument: (document: Nullable<Document>) => Document;
  [ModelName.DOCUMENTS]: {
    [id: string]: Document;
  };
};

export const useDocument = create<DocumentState>((set, get) => ({
  addMultipleResources: (documentsToAdd: Document[]) =>
    set(addMultipleResources(get(), ModelName.DOCUMENTS, documentsToAdd)),
  addResource: (document: Document) =>
    set(addResource<Document>(get(), ModelName.DOCUMENTS, document)),
  getDocument: (document: Nullable<Document>) => {
    return (
      get()[ModelName.DOCUMENTS][(document && document.id) || ''] || document
    );
  },
  removeResource: (document: Document) =>
    set(removeResource(get(), ModelName.DOCUMENTS, document)),
  [ModelName.DOCUMENTS]: {
    ...(appData.document ? { [appData.document.id]: appData.document } : {}),
  },
}));
