import { ReactNode } from 'react';
import { MessageDescriptor } from 'react-intl';
import { create } from 'zustand';

interface UseContentFeatures {
  featureRouter: ReactNode[];
  featureSamples: (playlistId?: string) => {
    title: MessageDescriptor;
    route: string;
    component: ReactNode;
  }[];
  featureShuffles: ReactNode[];
}

export const useContentFeatures = create<UseContentFeatures>(() => ({
  featureRouter: [],
  featureSamples: () => [],
  featureShuffles: [],
}));
