import create from 'zustand';
import { persist } from 'zustand/middleware';

import { DecodedJwt } from '../../../types/jwt';
import { decodeJwt } from '../../../utils/decodeJwt';

interface JwtStoreInterface {
  jwt?: string;
  jwtCreateTimestamp?: number;
  internalDecodedJwt?: DecodedJwt;
  setJwt: (jwt: string) => void;
  getDecodedJwt: () => DecodedJwt;
  reset: () => void;
}

export const useJwt = create<JwtStoreInterface>()(
  persist(
    (set, get) => ({
      jwt: undefined,
      internalDecodedJwt: undefined,
      jwtCreateTimestamp: undefined,
      setJwt: (jwt) =>
        set((state) => ({ ...state, jwt, jwtCreateTimestamp: Date.now() })),
      getDecodedJwt: () => {
        const currentValue = get().internalDecodedJwt;
        if (currentValue) {
          return currentValue;
        }

        const decoded = decodeJwt(get().jwt);
        set((state) => ({ ...state, internalDecodedJwt: decoded }));
        return decoded;
      },
      reset: () => {
        useJwt.persist.clearStorage();
        set((state) => ({
          ...state,
          jwt: undefined,
          jwtCreateTimestamp: undefined,
        }));
      },
    }),
    {
      name: 'jwt-storage',
    },
  ),
);
