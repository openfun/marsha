import React from 'react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';

import { RootState } from '../../data/rootReducer';
import { createPlayer } from '../../Player/createPlayer';
import { appState } from '../../types/AppData';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { DashboardConnected } from '../DashboardConnected/DashboardConnected';
import { ErrorComponent } from '../ErrorComponent/ErrorComponent';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { InstructorWrapperConnected } from '../InstructorWrapperConnected/InstructorWrapperConnected';
import { REDIRECT_ON_LOAD_ROUTE } from '../RedirectOnLoad/route';
import { RedirectOnLoadConnected } from '../RedirectOnLoadConnected/RedirectOnLoadConnected';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { UploadFormConnected } from '../UploadFormConnected/UploadFormConnected';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';
import { VideoPlayerConnected } from '../VideoPlayerConnected/VideoPlayerConnected';

interface AppRoutesProps {
  context: RootState<appState>['context'];
}

export const AppRoutes = ({ context }: AppRoutesProps) => {
  return (
    <MemoryRouter>
      <Switch>
        <Route
          exact
          path={VIDEO_PLAYER_ROUTE()}
          render={() => (
            <InstructorWrapperConnected>
              <VideoPlayerConnected
                video={context.ltiResourceVideo}
                createPlayer={createPlayer}
              />
            </InstructorWrapperConnected>
          )}
        />
        <Route
          exact
          path={UPLOAD_FORM_ROUTE()}
          render={({ match }) => (
            <UploadFormConnected
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
          render={() => (
            <DashboardConnected video={context.ltiResourceVideo!} />
          )}
        />
        <Route
          path={REDIRECT_ON_LOAD_ROUTE()}
          component={RedirectOnLoadConnected}
        />
      </Switch>
    </MemoryRouter>
  );
};
