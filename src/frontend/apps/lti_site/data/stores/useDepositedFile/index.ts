import create from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import { modelName as depositModelName } from 'apps/deposit/types/models';
import { StoreState } from 'types/stores';
import { DepositedFile } from 'apps/deposit/types/models';
import { Nullable } from 'utils/types';

type DepositedFileStateResource = {
  [depositModelName.DepositedFiles]: {
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
          depositModelName.DepositedFiles,
          depositedFileToAdd,
        ) as DepositedFileStateResource,
      ),
    addResource: (depositedFile: DepositedFile) =>
      set(
        addResource<DepositedFile>(
          get(),
          depositModelName.DepositedFiles,
          depositedFile,
        ) as DepositedFileStateResource,
      ),
    getDepositedFile: () => {
      if (Object.keys(get()[depositModelName.DepositedFiles]).length > 0) {
        const depositedFileId = Object.keys(
          get()[depositModelName.DepositedFiles],
        ).shift();
        return get()[depositModelName.DepositedFiles][depositedFileId!];
      }

      return null;
    },
    removeResource: (depositedFile: DepositedFile) =>
      set(
        removeResource(
          get(),
          depositModelName.DepositedFiles,
          depositedFile,
        ) as DepositedFileStateResource,
      ),
    [depositModelName.DepositedFiles]: {},
  };
});
