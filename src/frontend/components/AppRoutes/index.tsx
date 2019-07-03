import React from 'react';
import { MemoryRouter, Redirect, Route, Switch } from 'react-router-dom';

import { appData } from '../../data/appData';
import { createPlayer } from '../../Player/createPlayer';
import { Dashboard } from '../Dashboard';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ErrorComponent } from '../ErrorComponent';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { InstructorWrapper } from '../InstructorWrapper';
import { RedirectOnLoad } from '../RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from '../RedirectOnLoad/route';
import { UploadForm } from '../UploadForm';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { VideoPlayer } from '../VideoPlayer';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';

export const AppRoutes = () => (
  <MemoryRouter>
    <Switch>
      <Route
        exact
        path={VIDEO_PLAYER_ROUTE()}
        render={() => (
          <InstructorWrapper>
            <VideoPlayer video={appData.video} createPlayer={createPlayer} />
          </InstructorWrapper>
        )}
      />
      <Route
        exact
        path={UPLOAD_FORM_ROUTE()}
        render={({ match }) => (
          <UploadForm
            objectId={match.params.objectId}
            objectType={match.params.objectType}
          />
        )}
      />
      <Route
        exact
        path={ERROR_COMPONENT_ROUTE()}
        render={({ match }) => <ErrorComponent code={match.params.code} />}
      />
      <Route
        exact
        path={DASHBOARD_ROUTE()}
        render={() =>
          appData.video ? (
            <Dashboard video={appData.video} />
          ) : (
            <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />
          )
        }
      />
      <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
    </Switch>
  </MemoryRouter>
);
