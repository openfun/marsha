import { ReactNode } from 'react';
import { MessageDescriptor } from 'react-intl';
import { create } from 'zustand';

import { Route } from 'routes';

interface UseContentFeatures {
  featureRouter: ReactNode[];
  featureRoutes: Record<string, Route>;
  featureSamples: (playlistId?: string) => {
    title: MessageDescriptor;
    route: string;
    component: ReactNode;
  }[];
  featureShuffles: ReactNode[];
}

export const useContentFeatures = create<UseContentFeatures>(() => ({
  featureRouter: [],
  featureRoutes: {},
  featureSamples: () => [],
  featureShuffles: [],
}));
