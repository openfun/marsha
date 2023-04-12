import { ReactNode } from 'react';
import { create } from 'zustand';

interface UseContentFeatures {
  featureRoutes: ReactNode[];
  featureSamples: (playlistId?: string) => ReactNode[];
  featureShuffles: ReactNode[];
}

export const useContentFeatures = create<UseContentFeatures>(() => ({
  featureRoutes: [],
  featureSamples: () => [],
  featureShuffles: [],
}));
