/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Nullable } from 'lib-common';
import create from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import { DepositedFile } from 'types/apps/deposit/models';
import { FileDepositoryModelName } from 'types/apps/deposit/models';
import { StoreState } from 'types/stores';

type DepositedFileStateResource = {
  [FileDepositoryModelName.DepositedFiles]: {
    [id: string]: DepositedFile;
  };
};

type DepositedFileState = StoreState<DepositedFile> &
  DepositedFileStateResource & {
    getDepositedFile: () => Nullable<DepositedFile>;
  };

export const useDepositedFile = create<DepositedFileState>((set, get) => {
  return {
    addMultipleResources: (depositedFileToAdd: DepositedFile[]) =>
      set(
        addMultipleResources(
          get(),
          FileDepositoryModelName.DepositedFiles,
          depositedFileToAdd,
        ) as DepositedFileStateResource,
      ),
    addResource: (depositedFile: DepositedFile) =>
      set(
        addResource<DepositedFile>(
          get(),
          FileDepositoryModelName.DepositedFiles,
          depositedFile,
        ) as DepositedFileStateResource,
      ),
    getDepositedFile: () => {
      if (
        Object.keys(get()[FileDepositoryModelName.DepositedFiles]).length > 0
      ) {
        const depositedFileId = Object.keys(
          get()[FileDepositoryModelName.DepositedFiles],
        ).shift();
        return get()[FileDepositoryModelName.DepositedFiles][depositedFileId!];
      }

      return null;
    },
    removeResource: (depositedFile: DepositedFile) =>
      set(
        removeResource(
          get(),
          FileDepositoryModelName.DepositedFiles,
          depositedFile,
        ) as DepositedFileStateResource,
      ),
    [FileDepositoryModelName.DepositedFiles]: {},
  };
});
