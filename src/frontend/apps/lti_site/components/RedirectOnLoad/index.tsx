import * as React from 'react';
import { Redirect } from 'react-router-dom';

import {
  FULL_SCREEN_ERROR_ROUTE,
  useAppConfig,
  appState,
  modelName,
} from 'lib-components';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';
import { SELECT_CONTENT_ROUTE } from 'components/SelectContent/route';

import { RedirectVideo } from './RedirectVideo';
import { RedirectDocument } from './RedirectDocument';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const appData = useAppConfig();

  const resource = appData.document || appData.video || null;

  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('lti')} />;
  }

  if (appData.state === appState.PORTABILITY) {
    return <Redirect push to={RESOURCE_PORTABILITY_REQUEST_ROUTE()} />;
  }

  if (appData.lti_select_form_data) {
    return <Redirect push to={SELECT_CONTENT_ROUTE()} />;
  }

  if (!resource) {
    return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
  }

  switch (appData.modelName) {
    case modelName.DOCUMENTS:
      return <RedirectDocument document={appData.document!} />;
    case modelName.VIDEOS:
      return <RedirectVideo video={appData.video!} />;
  }
};
