import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { appData, getDecodedJwt } from '../../data/appData';
import { appState } from '../../types/AppData';
import { uploadState } from '../../types/tracks';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { PLAYER_ROUTE } from '../routes';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const resource = appData.document || appData.video || null;
  console.log(resource)
  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('lti')} />;
  }

  if (!resource) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
  }

  if (resource && resource.is_ready_to_show) {
    return <Redirect push to={PLAYER_ROUTE(appData.modelName)} />;
  }

  if (getDecodedJwt().permissions.can_update) {
    if (resource!.upload_state === uploadState.PENDING) {
      return (
        <Redirect
          push
          to={UPLOAD_FORM_ROUTE(appData.modelName, resource!.id)}
        />
      );
    } else {
      return <Redirect push to={DASHBOARD_ROUTE(appData.modelName)} />;
    }
  }

  // For safety default to the 404 view: this is for users not able to edit the current resource
  // when this one is not ready.
  return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
};
