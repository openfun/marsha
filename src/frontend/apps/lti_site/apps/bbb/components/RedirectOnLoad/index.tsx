import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';
import { useAppConfig } from 'data/stores/useAppConfig';

import { appState, flags } from 'types/AppData';

import { DASHBOARD_CLASSROOM_ROUTE } from '../DashboardClassroom/route';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const appData = useAppConfig();
  const isFeatureEnabled = useIsFeatureEnabled();

  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('lti')} />;
  }

  if (!isFeatureEnabled(flags.BBB)) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
  }

  return <Redirect push to={DASHBOARD_CLASSROOM_ROUTE()} />;
};
