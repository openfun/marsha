import React from 'react';

import { LiveModale } from 'components/live/common/LiveModale';
import {
  LiveModaleConfigurationProvider,
  useLiveModaleConfiguration,
} from 'hooks/useLiveModale';

const TestLiveModale = () => {
  const [modaleConfiguration] = useLiveModaleConfiguration();
  return (
    <div data-testid="test-modale">
      {modaleConfiguration && <LiveModale {...modaleConfiguration} />}
    </div>
  );
};

export const wrapInLiveModaleProvider = (Component: JSX.Element) => (
  <LiveModaleConfigurationProvider value={null}>
    <TestLiveModale />
    {Component}
  </LiveModaleConfigurationProvider>
);
