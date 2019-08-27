import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { appData } from '../../data/appData';
import { appState } from '../../types/AppData';
import { Document } from '../../types/file';
import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { DOCUMENT_PLAYER_ROUTE } from '../DocumentPlayer/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const resource = appData.document || appData.video || null;

  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Redirect push to={ERROR_COMPONENT_ROUTE('lti')} />;
  }

  if (
    appData.modelName === modelName.VIDEOS &&
    resource &&
    (resource as Video).is_ready_to_play
  ) {
    return <Redirect push to={VIDEO_PLAYER_ROUTE()} />;
  }

  if (
    appData.modelName === modelName.DOCUMENTS &&
    resource &&
    (resource as Document).is_ready_to_display
  ) {
    return <Redirect push to={DOCUMENT_PLAYER_ROUTE()} />;
  }

  if (appData.isEditable) {
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
