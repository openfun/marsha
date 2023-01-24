import create from 'zustand';
import { persist } from 'zustand/middleware';

import { DecodedJwt } from '../../../types/jwt';
import { decodeJwt } from '../../../utils/decodeJwt';

interface JwtStoreInterface {
  jwt?: string;
  refreshJwt?: string;
  internalDecodedJwt?: DecodedJwt;
  setJwt: (jwt: string) => void;
  setRefreshJwt: (jwt: string) => void;
  getDecodedJwt: () => DecodedJwt;
  resetJwt: () => void;
}

const localStore = create<JwtStoreInterface>((set, get) => ({
  jwt: undefined,
  refreshJwt: undefined,
  internalDecodedJwt: undefined,
  jwtCreateTimestamp: undefined,
  setJwt: (jwt) => set((state) => ({ ...state, jwt })),
  setRefreshJwt: (refreshJwt) => set((state) => ({ ...state, refreshJwt })),
  getDecodedJwt: () => {
    const currentValue = get().internalDecodedJwt;
    if (currentValue) {
      return currentValue;
    }

    const decoded = decodeJwt(get().jwt);
    set((state) => ({ ...state, internalDecodedJwt: decoded }));
    return decoded;
  },
  resetJwt: () => {
    set((state) => ({
      ...state,
      jwt: undefined,
      refreshJwt: undefined,
    }));
  },
}));

const persistentStore = create<JwtStoreInterface>()(
  persist(
    (set, get) => ({
      jwt: undefined,
      refreshJwt: undefined,
      internalDecodedJwt: undefined,
      jwtCreateTimestamp: undefined,
      setJwt: (jwt) => set((state) => ({ ...state, jwt })),
      setRefreshJwt: (refreshJwt) => set((state) => ({ ...state, refreshJwt })),
      getDecodedJwt: () => {
        const currentValue = get().internalDecodedJwt;
        if (currentValue) {
          return currentValue;
        }

        const decoded = decodeJwt(get().jwt);
        set((state) => ({ ...state, internalDecodedJwt: decoded }));
        return decoded;
      },
      resetJwt: () => {
        persistentStore.persist.clearStorage();
        set((state) => ({
          ...state,
          jwt: undefined,
          refreshJwt: undefined,
        }));
      },
    }),
    {
      name: 'jwt-storage',
    },
  ),
);

export const useJwt = window.use_jwt_persistence ? persistentStore : localStore;
