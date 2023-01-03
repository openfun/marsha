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
  reset?: () => void;
}

const useJwtPersist = create<JwtStoreInterface>()(
  persist(
    (set, get) => ({
      jwt: undefined,
      internalDecodedJwt: undefined,
      jwtCreateTimestamp: undefined,
      setJwt: (jwt) =>
        set((state) => ({
          ...state,
          jwt,
          jwtCreateTimestamp: Date.now(),
        })),
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
        useJwtPersist.persist.clearStorage();
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

export const useJwt =
  process.env.REACT_APP_TOKEN_WITH_PERSIST === 'true'
    ? useJwtPersist
    : create<JwtStoreInterface>((set, get) => ({
        jwt: undefined,
        internalDecodedJwt: undefined,
        setJwt: (jwt) => set((state) => ({ ...state, jwt })),
        getDecodedJwt: () => {
          const currentValue = get().internalDecodedJwt;
          if (currentValue) {
            return currentValue;
          }

          const decoded = decodeJwt(get().jwt);
          set((state) => ({ ...state, internalDecodedJwt: decoded }));
          return decoded;
        },
      }));
