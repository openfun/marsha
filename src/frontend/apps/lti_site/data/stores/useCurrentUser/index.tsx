import { Nullable } from 'lib-common';
import create from 'zustand';

import { getCurrentUser } from '../../sideEffects/getCurrentUser';
import { User } from '../../../types/User';

export enum AnonymousUser {
  ANONYMOUS = 'AnonymousUser',
}

type CurrentUserState = {
  getCurrentUser: () => Nullable<User | AnonymousUser>;
  setCurrentUser: (user: User | AnonymousUser) => void;
  currentUser: Nullable<User | AnonymousUser>;
};

export const useCurrentUser = create<CurrentUserState>((set, get) => ({
  currentUser: null,
  setCurrentUser: (currentUser) => {
    set({ currentUser });
  },
  getCurrentUser: () => {
    const currentUser = get().currentUser;
    if (!currentUser) {
      getCurrentUser();
    }
    return get().currentUser;
  },
}));
