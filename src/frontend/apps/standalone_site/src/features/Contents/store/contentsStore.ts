import { ReactNode } from 'react';
import { create } from 'zustand';

interface UseContentFeatures {
  featureRoutes: ReactNode[];
}

export const useContentFeatures = create<UseContentFeatures>(() => ({
  featureRoutes: [],
}));
