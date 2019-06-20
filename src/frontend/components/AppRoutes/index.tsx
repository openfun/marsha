import React from 'react';
import { connect } from 'react-redux';
import { MemoryRouter, Route, Switch } from 'react-router-dom';

import { RootState } from '../../data/rootReducer';
import { createPlayer } from '../../Player/createPlayer';
import { appState } from '../../types/AppData';
import { Dashboard } from '../Dashboard';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ErrorComponent } from '../ErrorComponent/ErrorComponent';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { InstructorWrapper } from '../InstructorWrapper';
import { RedirectOnLoad } from '../RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from '../RedirectOnLoad/route';
import { UploadForm } from '../UploadForm';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { VideoPlayer } from '../VideoPlayer';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';

interface BaseAppRoutesProps {
  context: RootState<appState>['context'];
}

const BaseAppRoutes = ({ context }: BaseAppRoutesProps) => {
  return (
    <MemoryRouter>
      <Switch>
        <Route
          exact
          path={VIDEO_PLAYER_ROUTE()}
          render={() => (
            <InstructorWrapper>
              <VideoPlayer
                video={context.ltiResourceVideo}
                createPlayer={createPlayer}
              />
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
          render={() => <Dashboard video={context.ltiResourceVideo!} />}
        />
        <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
      </Switch>
    </MemoryRouter>
  );
};

/**
 * Pick the state context so it can be used to render any route.
 */
const mapStateToProps = (state: RootState<appState>) => ({
  context: state.context,
});

/**
 * Dynamically render all the possible routes in the app with proper context already
 * baked in.
 */
export const AppRoutes = connect(mapStateToProps)(BaseAppRoutes);
