import create from 'zustand';

import { DecodedJwt } from '../../../types/jwt';
import { decodeJwt } from '../../../utils/decodeJwt';

interface JwtStoreInterface {
  jwt?: string;
  internalDecodedJwt?: DecodedJwt;
  setJwt: (jwt: string) => void;
  getDecodedJwt: () => DecodedJwt;
}

export const useJwt = create<JwtStoreInterface>((set, get) => ({
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
