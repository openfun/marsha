import {
  ErrorComponents,
  appState,
  builderFullScreenErrorRoute,
  modelName,
  useAppConfig,
} from 'lib-components';
import { Fragment } from 'react';
import { Navigate } from 'react-router-dom';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';
import { SELECT_CONTENT_ROUTE } from 'components/SelectContent/route';

import { RedirectDocument } from './RedirectDocument';
import { RedirectVideo } from './RedirectVideo';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const appData = useAppConfig();

  const resource = appData.document || appData.video || null;

  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Navigate to={builderFullScreenErrorRoute(ErrorComponents.lti)} />;
  }

  if (appData.state === appState.PORTABILITY) {
    return <Navigate to={RESOURCE_PORTABILITY_REQUEST_ROUTE} />;
  }

  if (appData.lti_select_form_data) {
    return <Navigate to={SELECT_CONTENT_ROUTE} />;
  }

  if (!resource) {
    return (
      <Navigate to={builderFullScreenErrorRoute(ErrorComponents.notFound)} />
    );
  }

  if (appData.modelName === modelName.DOCUMENTS && appData.document) {
    return <RedirectDocument document={appData.document} />;
  }

  if (appData.modelName === modelName.VIDEOS && appData.video) {
    return <RedirectVideo video={appData.video} />;
  }

  return <Fragment />;
};
