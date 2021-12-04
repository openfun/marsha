import * as React from 'react';
import { Navigate } from 'react-router-dom';

import { appData } from '../../data/appData';
import { appState } from '../../types/AppData';
import { modelName } from '../../types/models';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { SELECT_CONTENT_ROUTE } from '../SelectContent/route';
import { RedirectVideo } from './RedirectVideo';
import { RedirectDocument } from './RedirectDocument';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const resource = appData.document || appData.video || null;
  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Navigate to={FULL_SCREEN_ERROR_ROUTE('lti')} />;
  }

  if (appData.lti_select_form_data) {
    return <Navigate to={SELECT_CONTENT_ROUTE()} />;
  }

  if (!resource) {
    return <Navigate to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
  }

  switch (appData.modelName) {
    case modelName.DOCUMENTS:
      return <RedirectDocument document={appData.document!} />;
    case modelName.VIDEOS:
      return <RedirectVideo video={appData.video!} />;
  }
};
