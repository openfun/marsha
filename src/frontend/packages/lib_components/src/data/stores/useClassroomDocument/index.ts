/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Nullable } from 'lib-common';
import create from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import { ClassroomDocument } from 'types/apps/classroom/models';
import { modelName as bbbModelName } from 'types/apps/classroom/models';
import { StoreState } from 'types/stores';

type ClassroomDocumentStateResource = {
  [bbbModelName.CLASSROOM_DOCUMENTS]: {
    [id: string]: ClassroomDocument;
  };
};

type ClassroomDocumentState = StoreState<ClassroomDocument> &
  ClassroomDocumentStateResource & {
    getClassroomDocument: () => Nullable<ClassroomDocument>;
  };

export const useClassroomDocument = create<ClassroomDocumentState>(
  (set, get) => {
    return {
      addMultipleResources: (classroomDocumentToAdd: ClassroomDocument[]) =>
        set(
          addMultipleResources(
            get(),
            bbbModelName.CLASSROOM_DOCUMENTS,
            classroomDocumentToAdd,
          ) as ClassroomDocumentStateResource,
        ),
      addResource: (classroomDocument: ClassroomDocument) =>
        set(
          addResource<ClassroomDocument>(
            get(),
            bbbModelName.CLASSROOM_DOCUMENTS,
            classroomDocument,
          ) as ClassroomDocumentStateResource,
        ),
      getClassroomDocument: () => {
        if (Object.keys(get()[bbbModelName.CLASSROOM_DOCUMENTS]).length > 0) {
          const classroomDocumentId = Object.keys(
            get()[bbbModelName.CLASSROOM_DOCUMENTS],
          ).shift();
          return get()[bbbModelName.CLASSROOM_DOCUMENTS][classroomDocumentId!];
        }

        return null;
      },
      removeResource: (classroomDocument: ClassroomDocument) =>
        set(
          removeResource(
            get(),
            bbbModelName.CLASSROOM_DOCUMENTS,
            classroomDocument,
          ) as ClassroomDocumentStateResource,
        ),
      [bbbModelName.CLASSROOM_DOCUMENTS]: {},
    };
  },
);
