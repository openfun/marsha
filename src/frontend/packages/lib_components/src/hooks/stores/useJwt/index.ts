import { create } from 'zustand';

import { DecodedJwt } from '../../../types/jwt';
import { decodeJwt } from '../../../utils/decodeJwt';

export const JWT_KEY = 'JWT';
export const REFRESH_JWT_KEY = 'REFRESH_JWT';

interface JwtStoreInterface {
  refreshJwtBlackListed?: string;
  jwt?: string;
  refreshJwt?: string;
  internalDecodedJwt?: DecodedJwt;
  withPersistancy: boolean;
  setWithPersistancy: (withPersistancy: boolean) => void;
  getJwt: () => JwtStoreInterface['jwt'];
  setJwt: (jwt: JwtStoreInterface['jwt']) => void;
  getRefreshJwt: () => JwtStoreInterface['refreshJwt'];
  setRefreshJwt: (refreshJwt: JwtStoreInterface['refreshJwt']) => void;
  setRefreshJwtBlackListed: (refreshJwt: string) => void;
  setDecodedJwt: (jwt: JwtStoreInterface['jwt']) => void;
  getDecodedJwt: () => JwtStoreInterface['internalDecodedJwt'];
  resetJwt: () => void;
}

export const useJwt = create<JwtStoreInterface>((set, get) => ({
  refreshJwtBlackListed: undefined,
  jwt: localStorage.getItem(JWT_KEY) || undefined,
  refreshJwt: localStorage.getItem(REFRESH_JWT_KEY) || undefined,
  internalDecodedJwt: undefined,
  withPersistancy: !!window.use_jwt_persistence,
  setWithPersistancy: (withPersistancy) => {
    set((state) => ({ ...state, withPersistancy }));
  },
  getJwt() {
    if (!get().withPersistancy) {
      return get().jwt;
    }

    const jwt = localStorage.getItem(JWT_KEY) || undefined;
    if (jwt !== get().jwt) {
      get().setJwt(jwt);
    }
    return jwt;
  },
  setJwt: (jwt) => {
    if (get().withPersistancy) {
      jwt
        ? localStorage.setItem(JWT_KEY, jwt)
        : localStorage.removeItem(JWT_KEY);

      get().setDecodedJwt(jwt);
    }

    set((state) => ({ ...state, jwt }));
  },
  getRefreshJwt() {
    if (!get().withPersistancy) {
      return get().refreshJwt;
    }

    const refreshJwt = localStorage.getItem(REFRESH_JWT_KEY) || undefined;
    if (refreshJwt !== get().refreshJwt) {
      get().setRefreshJwt(refreshJwt);
    }
    return refreshJwt;
  },
  setRefreshJwt: (refreshJwt) => {
    if (get().withPersistancy) {
      refreshJwt
        ? localStorage.setItem(REFRESH_JWT_KEY, refreshJwt)
        : localStorage.removeItem(REFRESH_JWT_KEY);
    }

    set((state) => ({ ...state, refreshJwt }));
  },
  setRefreshJwtBlackListed: (refreshJwt) => {
    set((state) => ({
      ...state,
      refreshJwtBlackListed: refreshJwt,
    }));
  },
  setDecodedJwt: (jwt) => {
    if (jwt) {
      const decoded = decodeJwt(jwt);
      set((state) => ({ ...state, internalDecodedJwt: decoded }));
    } else {
      if (get().internalDecodedJwt) {
        set((state) => ({ ...state, internalDecodedJwt: undefined }));
      }
    }
  },
  getDecodedJwt: () => {
    const currentValue = get().internalDecodedJwt;
    if (currentValue) {
      return currentValue;
    }

    get().setDecodedJwt(get().getJwt());
    return get().internalDecodedJwt;
  },
  resetJwt: () => {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(REFRESH_JWT_KEY);
    set((state) => ({
      ...state,
      jwt: undefined,
      refreshJwt: undefined,
      internalDecodedJwt: undefined,
    }));
  },
}));
