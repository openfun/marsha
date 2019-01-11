import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { appState } from '../../types/AppData';
import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
import { Nullable } from '../../utils/types';
import { ROUTE as DASHBOARD_ROUTE } from '../Dashboard/Dashboard';
import { ROUTE as ERROR_ROUTE } from '../ErrorComponent/ErrorComponent';
import { ROUTE as FORM_ROUTE } from '../UploadForm/UploadForm';
import { ROUTE as PLAYER_ROUTE } from '../VideoPlayer/VideoPlayer';

export const ROUTE = () => '/';

interface RedirectOnLoadProps {
  ltiState: appState;
  video: Nullable<Video>;
}

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = ({ ltiState, video }: RedirectOnLoadProps) => {
  // Get LTI errors out of the way
  if (ltiState === appState.ERROR) {
    return <Redirect push to={ERROR_ROUTE('lti')} />;
  }
  // Everyone gets the video when it exists (so that instructors see the iframes like a student would by default)
  else if (video && video.is_ready_to_play) {
    return <Redirect push to={PLAYER_ROUTE()} />;
  }
  // Only instructors are allowed to interact with a non-ready video
  else if (ltiState === appState.INSTRUCTOR) {
    if (video!.upload_state === uploadState.PENDING) {
      return <Redirect push to={FORM_ROUTE(modelName.VIDEOS, video!.id)} />;
    } else {
      return <Redirect push to={DASHBOARD_ROUTE()} />;
    }
  }
  // For safety default to the 404 view: this is for students, and any other role we add later on and don't add
  // a special clause for, when the video is not ready.
  else {
    return <Redirect push to={ERROR_ROUTE('notFound')} />;
  }
};
