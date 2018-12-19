import React from 'react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';

import { RootState } from '../../data/rootReducer';
import { ROUTE as DASHBOARD_ROUTE } from '../Dashboard/Dashboard';
import { DashboardConnected } from '../DashboardConnected/DashboardConnected';
import {
  ErrorComponent,
  ROUTE as ERROR_ROUTE,
} from '../ErrorComponent/ErrorComponent';
import { InstructorWrapperConnected } from '../InstructorWrapperConnected/InstructorWrapperConnected';
import { ROUTE as HOME_ROUTE } from '../RedirectOnLoad/RedirectOnLoad';
import { RedirectOnLoadConnected } from '../RedirectOnLoadConnected/RedirectOnLoadConnected';
import { ROUTE as FORM_ROUTE } from '../UploadForm/UploadForm';
import { UploadFormConnected } from '../UploadFormConnected/UploadFormConnected';
import { ROUTE as PLAYER_ROUTE } from '../VideoPlayer/VideoPlayer';
import { VideoPlayerConnected } from '../VideoPlayerConnected/VideoPlayerConnected';

interface AppRoutesProps {
  context: RootState['context'];
}

export const AppRoutes = ({ context }: AppRoutesProps) => {
  return (
    <MemoryRouter>
      <Switch>
        <Route
          exact
          path={PLAYER_ROUTE()}
          render={() => (
            <InstructorWrapperConnected>
              <VideoPlayerConnected video={context.ltiResourceVideo} />
            </InstructorWrapperConnected>
          )}
        />
        <Route
          exact
          path={FORM_ROUTE()}
          render={({ match }) => (
            <UploadFormConnected
              objectId={match.params.objectId}
              objectType={match.params.objectType}
            />
          )}
        />
        <Route
          exact
          path={ERROR_ROUTE()}
          render={({ match }) => <ErrorComponent code={match.params.code} />}
        />
        <Route
          exact
          path={DASHBOARD_ROUTE()}
          render={() => <DashboardConnected video={context.ltiResourceVideo} />}
        />
        <Route path={HOME_ROUTE()} component={RedirectOnLoadConnected} />
      </Switch>
    </MemoryRouter>
  );
};
