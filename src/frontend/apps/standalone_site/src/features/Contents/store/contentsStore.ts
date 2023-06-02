import { ReactNode } from 'react';
import { MessageDescriptor } from 'react-intl';
import { create } from 'zustand';

import { Route } from 'routes';

export type FeatureSample = {
  title: MessageDescriptor;
  route: string;
  component: ReactNode;
};

export interface UseContentFeatures {
  featureRouter: ReactNode[];
  featureRoutes: Record<string, Route>;
  featureSamples: (playlistId?: string) => FeatureSample[];
  featureShuffles: ReactNode[];
}

export const useContentFeatures = create<UseContentFeatures>(() => ({
  featureRouter: [],
  featureRoutes: {},
  featureSamples: () => [],
  featureShuffles: [],
}));
