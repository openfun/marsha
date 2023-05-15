import { create } from 'zustand';

import { DecodedJwt } from '../../../types/jwt';
import { decodeJwt } from '../../../utils/decodeJwt';

const JWT_KEY = 'JWT';
const REFRESH_JWT_KEY = 'REFRESH_JWT';

interface JwtStoreInterface {
  jwt?: string;
  refreshJwt?: string;
  internalDecodedJwt?: DecodedJwt;
  getJwt: () => JwtStoreInterface['jwt'];
  setJwt: (jwt: JwtStoreInterface['jwt']) => void;
  getRefreshJwt: () => JwtStoreInterface['refreshJwt'];
  setRefreshJwt: (refreshJwt: JwtStoreInterface['refreshJwt']) => void;
  setDecodedJwt: (jwt: JwtStoreInterface['jwt']) => void;
  getDecodedJwt: () => JwtStoreInterface['internalDecodedJwt'];
  resetJwt: () => void;
}

const localStore = create<JwtStoreInterface>((set, get) => ({
  jwt: undefined,
  refreshJwt: undefined,
  internalDecodedJwt: undefined,
  getJwt: () => get().jwt,
  setJwt: (jwt) => set((state) => ({ ...state, jwt })),
  getRefreshJwt: () => get().refreshJwt,
  setRefreshJwt: (refreshJwt) => set((state) => ({ ...state, refreshJwt })),
  setDecodedJwt: (jwt) => {
    const decoded = decodeJwt(jwt);
    set((state) => ({ ...state, internalDecodedJwt: decoded }));
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
    set((state) => ({
      ...state,
      jwt: undefined,
      refreshJwt: undefined,
    }));
  },
}));

export const persistentStore = create<JwtStoreInterface>((set, get) => ({
  jwt: localStorage.getItem(JWT_KEY) || undefined,
  refreshJwt: localStorage.getItem(REFRESH_JWT_KEY) || undefined,
  internalDecodedJwt: undefined,
  getJwt() {
    const jwt = localStorage.getItem(JWT_KEY) || undefined;
    if (jwt !== get().jwt) {
      get().setJwt(jwt);
    }
    return jwt;
  },
  setJwt: (jwt) => {
    jwt ? localStorage.setItem(JWT_KEY, jwt) : localStorage.removeItem(JWT_KEY);
    get().setDecodedJwt(jwt);
    set((state) => ({ ...state, jwt }));
  },
  getRefreshJwt() {
    const refreshJwt = localStorage.getItem(REFRESH_JWT_KEY) || undefined;
    if (refreshJwt !== get().refreshJwt) {
      get().setRefreshJwt(refreshJwt);
    }
    return refreshJwt;
  },
  setRefreshJwt: (refreshJwt) => {
    refreshJwt
      ? localStorage.setItem(REFRESH_JWT_KEY, refreshJwt)
      : localStorage.removeItem(REFRESH_JWT_KEY);
    set((state) => ({ ...state, refreshJwt }));
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

export const useJwt = window.use_jwt_persistence ? persistentStore : localStore;
