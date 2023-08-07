import { create } from 'zustand';

import { getLanguage } from '../utils';

interface UseLanguageStore {
  language: string;
}

export const useLanguageStore = create<UseLanguageStore>(() => ({
  language: getLanguage(),
}));
