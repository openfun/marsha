import * as React from 'react';
import { Redirect } from 'react-router-dom';

import {
  useCurrentResourceContext,
  useJwt,
  FULL_SCREEN_ERROR_ROUTE,
  useAppConfig,
  appState,
  flags,
} from 'lib-components';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';

import {
  MARKDOWN_EDITOR_ROUTE,
  MARKDOWN_NOT_FOUND_ROUTE,
  MARKDOWN_VIEWER_ROUTE,
} from 'lib-markdown';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const appData = useAppConfig();
  const isFeatureEnabled = useIsFeatureEnabled();

  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('lti')} />;
  }

  if (!isFeatureEnabled(flags.MARKDOWN)) {
    return <Redirect push to={MARKDOWN_NOT_FOUND_ROUTE()} />;
  }

  if (appData.state === appState.PORTABILITY) {
    return <Redirect push to={RESOURCE_PORTABILITY_REQUEST_ROUTE()} />;
  }

  // Deal with missing JWT (the resource may be not available yet)
  if (!useJwt.getState().jwt) {
    return <Redirect push to={MARKDOWN_NOT_FOUND_ROUTE()} />;
  }

  const [context] = useCurrentResourceContext();

  if (context.permissions.can_update) {
    return <Redirect push to={MARKDOWN_EDITOR_ROUTE()} />;
  } else {
    return <Redirect push to={MARKDOWN_VIEWER_ROUTE()} />;
  }
};
