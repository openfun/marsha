import create from 'zustand';

import { Document } from '../../../types/file';
import { modelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

interface DocumentState extends StoreState<Document> {
  getDocument: (document: Nullable<Document>) => Document;
  [modelName.DOCUMENTS]: {
    [id: string]: Document;
  };
}

export const [useDocument, useDocumentApi] = create<DocumentState>(
  (set, get) => ({
    addMultipleResources: (documentsToAdd: Document[]) =>
      set(addMultipleResources(get(), modelName.DOCUMENTS, documentsToAdd)),
    addResource: (document: Document) =>
      set(addResource<Document>(get(), modelName.DOCUMENTS, document)),
    getDocument: (document: Nullable<Document>) => {
      return (
        get()[modelName.DOCUMENTS][(document && document.id) || ''] || document
      );
    },
    removeResource: (document: Document) =>
      set(removeResource(get(), modelName.DOCUMENTS, document)),
    [modelName.DOCUMENTS]: {
      ...(appData.document ? { [appData.document.id]: appData.document } : {}),
    },
  }),
);
