import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { FULL_SCREEN_ERROR_ROUTE } from 'lib-components';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';
import { useAppConfig } from 'lib-components';

import { appState, flags } from 'lib-components';

import { DASHBOARD_{{ cookiecutter.app_name|upper }}_ROUTE } from '../Dashboard{{cookiecutter.model}}/route';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const appData = useAppConfig();
  const isFeatureEnabled = useIsFeatureEnabled();

  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('lti')} />;
  }

  if (!isFeatureEnabled(flags.{{ cookiecutter.flag }})) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
  }

  return <Redirect push to={DASHBOARD_{{ cookiecutter.app_name|upper }}_ROUTE()} />;
};
