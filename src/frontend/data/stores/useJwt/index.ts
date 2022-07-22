import create from 'zustand';

import { decodeJwt } from 'components/App/AppContentLoader/utils';
import { DecodedJwt } from 'types/jwt';

interface StoreType {
  jwt?: string;
  internalDecodedJwt?: DecodedJwt;
  setJwt: (jwt: string) => void;
  getDecodedJwt: () => DecodedJwt;
}

export const useAuthenticatedUser = create<StoreType>((set, get) => ({
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
