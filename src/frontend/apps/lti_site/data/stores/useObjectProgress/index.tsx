import { Maybe } from 'lib-common';
import { create } from 'zustand';

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
