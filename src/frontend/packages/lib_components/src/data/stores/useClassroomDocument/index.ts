import { Nullable } from 'lib-common';
import { create } from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import {
  ClassroomDocument,
  ClassroomModelName,
} from 'types/apps/classroom/models';
import { StoreState } from 'types/stores';

type ClassroomDocumentStateResource = {
  [ClassroomModelName.CLASSROOM_DOCUMENTS]: {
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
            ClassroomModelName.CLASSROOM_DOCUMENTS,
            classroomDocumentToAdd,
          ) as ClassroomDocumentStateResource,
        ),
      addResource: (classroomDocument: ClassroomDocument) =>
        set(
          addResource<ClassroomDocument>(
            get(),
            ClassroomModelName.CLASSROOM_DOCUMENTS,
            classroomDocument,
          ) as ClassroomDocumentStateResource,
        ),
      getClassroomDocument: () => {
        if (
          Object.keys(get()[ClassroomModelName.CLASSROOM_DOCUMENTS]).length > 0
        ) {
          const classroomDocumentId = Object.keys(
            get()[ClassroomModelName.CLASSROOM_DOCUMENTS],
          ).shift() as string;
          return get()[ClassroomModelName.CLASSROOM_DOCUMENTS][
            classroomDocumentId
          ];
        }

        return null;
      },
      removeResource: (classroomDocument: ClassroomDocument) =>
        set(
          removeResource(
            get(),
            ClassroomModelName.CLASSROOM_DOCUMENTS,
            classroomDocument,
          ) as ClassroomDocumentStateResource,
        ),
      [ClassroomModelName.CLASSROOM_DOCUMENTS]: {},
    };
  },
);
