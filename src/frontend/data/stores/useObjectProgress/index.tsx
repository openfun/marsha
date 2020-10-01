import create from 'zustand';

import { Maybe } from '../../../utils/types';

export interface ObjectProgress {
  [uploadableObjectId: string]: Maybe<number>;
}

type State = {
  objectProgress: ObjectProgress;
  setObjectProgress: (objectId: string, progress: number) => void;
};

export const useObjectProgress = create<State>((set, get) => ({
  objectProgress: {},
  setObjectProgress: (objectId, progress) =>
    set({
      objectProgress: {
        ...get().objectProgress,
        [objectId]: progress,
      },
    }),
}));
