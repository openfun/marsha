import { create } from 'zustand';

import { LANGUAGE_LOCAL_STORAGE } from '../conf';
import { getLanguage } from '../utils';

interface UseLanguageStore {
  language: string;
  setLanguage: (locale: string) => void;
}

export const useLanguageStore = create<UseLanguageStore>((set) => ({
  language: getLanguage(),
  setLanguage: (_locale: string) => {
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE, _locale);
    const language = getLanguage();
    set({ language });
  },
}));
