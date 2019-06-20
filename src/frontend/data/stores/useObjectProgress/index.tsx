import create from 'zustand';

import { Maybe } from '../../../utils/types';

export interface ObjectProgress {
  [uploadableObjectId: string]: Maybe<number>;
}

export const [useObjectProgress] = create((set, get) => ({
  objectProgress: {} as ObjectProgress,
  setObjectProgress: (objectId: string, progress: number) =>
    set({
      objectProgress: {
        ...get().objectProgress,
        [objectId]: progress,
      },
    }),
}));
