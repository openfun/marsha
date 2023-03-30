import { Nullable } from 'lib-common';
import { create } from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from '@lib-components/data/stores/actions';
import { Document } from '@lib-components/types/file';
import { modelName } from '@lib-components/types/models';
import { StoreState } from '@lib-components/types/stores';

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
  [modelName.DOCUMENTS]: {},
}));
