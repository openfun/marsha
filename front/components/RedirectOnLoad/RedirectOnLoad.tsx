import * as React from 'react';
import { Redirect } from 'react-router-dom';

import { AppDataContext } from '../..';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  return (
    <AppDataContext.Consumer>
      {appData => {
        const { state, video } = appData;

        // Get LTI errors out of the way
        if (state === 'error') {
          return <Redirect push to="/errors/lti" />;
        }
        // Everyone gets the video when it exists (so that instructors see the iframes like a student would by default)
        else if (video.status === 'ready') {
          return <Redirect push to="/player" />;
        }
        // Only instructors are allowed to interact with a non-ready video
        else if (state === 'instructor') {
          return <Redirect push to="/form" />;
        }
        // For safety default to the 404 view: this is for students, and any other role we add later on and don't add
        // a special clause for, when the video is not ready.
        else {
          return <Redirect push to="/errors/notFound" />;
        }
      }}
    </AppDataContext.Consumer>
  );
};
