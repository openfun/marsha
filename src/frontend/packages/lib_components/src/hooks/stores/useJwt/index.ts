import { create } from 'zustand';

import { DecodedJwt } from '../../../types/jwt';
import { decodeJwt } from '../../../utils/decodeJwt';

const JWT_KEY = 'JWT';
const REFRESH_JWT_KEY = 'REFRESH_JWT';

interface JwtStoreInterface {
  jwt?: string;
  refreshJwt?: string;
  internalDecodedJwt?: DecodedJwt;
  getJwt: () => string | undefined;
  setJwt: (jwt: string) => void;
  getRefreshJwt: () => string | undefined;
  setRefreshJwt: (jwt: string) => void;
  getDecodedJwt: () => DecodedJwt;
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
  getDecodedJwt: () => {
    const currentValue = get().internalDecodedJwt;
    if (currentValue) {
      return currentValue;
    }

    const decoded = decodeJwt(get().getJwt());
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

export const persistentStore = create<JwtStoreInterface>((set, get) => ({
  jwt: localStorage.getItem(JWT_KEY) || undefined,
  refreshJwt: localStorage.getItem(REFRESH_JWT_KEY) || undefined,
  internalDecodedJwt: undefined,
  getJwt() {
    const jwt = localStorage.getItem(JWT_KEY) || undefined;
    if (jwt !== get().jwt) {
      set((state) => ({ ...state, jwt, internalDecodedJwt: undefined }));
    }
    return jwt;
  },
  setJwt: (jwt) => {
    localStorage.setItem(JWT_KEY, jwt);
    set((state) => ({ ...state, jwt, internalDecodedJwt: undefined }));
  },
  getRefreshJwt() {
    const refreshJwt = localStorage.getItem(REFRESH_JWT_KEY) || undefined;
    if (refreshJwt !== get().refreshJwt) {
      set((state) => ({ ...state, refreshJwt, internalDecodedJwt: undefined }));
    }
    return refreshJwt;
  },
  setRefreshJwt: (refreshJwt) => {
    localStorage.setItem(REFRESH_JWT_KEY, refreshJwt);
    set((state) => ({ ...state, refreshJwt }));
  },
  getDecodedJwt: () => {
    const currentValue = get().internalDecodedJwt;
    if (currentValue) {
      return currentValue;
    }

    const decoded = decodeJwt(get().getJwt());
    set((state) => ({ ...state, internalDecodedJwt: decoded }));
    return decoded;
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
