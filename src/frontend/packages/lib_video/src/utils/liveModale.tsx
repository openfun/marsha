import React from 'react';

import { LiveModale } from '@lib-video/components/live/common/LiveModale';
import {
  LiveModaleConfigurationProvider,
  useLiveModaleConfiguration,
} from '@lib-video/hooks/useLiveModale';

const TestLiveModale = () => {
  const [modaleConfiguration] = useLiveModaleConfiguration();
  return (
    <div data-testid="test-modale">
      {modaleConfiguration && <LiveModale {...modaleConfiguration} />}
    </div>
  );
};

export const wrapInLiveModaleProvider = (Component: React.JSX.Element) => (
  <LiveModaleConfigurationProvider value={null}>
    <TestLiveModale />
    {Component}
  </LiveModaleConfigurationProvider>
);
