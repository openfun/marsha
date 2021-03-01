import create from 'zustand';

import { Document } from '../../../types/file';
import { modelName } from '../../../types/models';
import { StoreState } from '../../../types/stores';
import { Nullable } from '../../../utils/types';
import { appData } from '../../appData';
import { addMultipleResources, addResource, removeResource } from '../actions';

type DocumentStateResource = {
  [modelName.DOCUMENTS]: {
    [id: string]: Document;
  };
};

type DocumentState = StoreState<Document> &
  DocumentStateResource & {
    getDocument: (document: Nullable<Document>) => Document;
  };

export const useDocument = create<DocumentState>((set, get) => ({
  addMultipleResources: (documentsToAdd: Document[]) =>
    set(
      addMultipleResources(
        get(),
        modelName.DOCUMENTS,
        documentsToAdd,
      ) as DocumentStateResource,
    ),
  addResource: (document: Document) =>
    set(
      addResource<Document>(
        get(),
        modelName.DOCUMENTS,
        document,
      ) as DocumentStateResource,
    ),
  getDocument: (document: Nullable<Document>) => {
    return (
      get()[modelName.DOCUMENTS][(document && document.id) || ''] || document
    );
  },
  removeResource: (document: Document) =>
    set(
      removeResource(
        get(),
        modelName.DOCUMENTS,
        document,
      ) as DocumentStateResource,
    ),
  [modelName.DOCUMENTS]: {
    ...(appData.document ? { [appData.document.id]: appData.document } : {}),
  },
}));
