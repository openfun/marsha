import type { Nullable } from 'lib-common';
import { create } from 'zustand';

import type { User } from '../../../types/User';

export enum AnonymousUser {
  ANONYMOUS = 'AnonymousUser',
}

interface CurrentUserState {
  setCurrentUser: (user: User | AnonymousUser) => void;
  currentUser: Nullable<User | AnonymousUser>;
}

export const useCurrentUser = create<CurrentUserState>((set) => ({
  currentUser: null,
  setCurrentUser: (currentUser) => {
    set({ currentUser });
  },
}));
