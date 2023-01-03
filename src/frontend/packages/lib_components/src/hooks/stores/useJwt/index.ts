import create from 'zustand';
import { persist } from 'zustand/middleware';

import { AppData } from '../../../types/AppData';
import { DecodedJwt } from '../../../types/jwt';
import { decodeJwt } from '../../../utils/decodeJwt';

const domElementToParse = document.getElementById('marsha-frontend-data');
let storageName = 'jwt-storage';
if (domElementToParse) {
  const dataContext = domElementToParse.getAttribute('data-context');
  if (dataContext) {
    const context = JSON.parse(dataContext) as AppData;
    storageName = `jwt-store-${context.modelName}-${
      context.resource?.id || ''
    }`;
  }
}

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
      name: storageName,
    },
  ),
);
