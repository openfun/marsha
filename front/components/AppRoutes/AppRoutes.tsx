import React from 'react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';

import { AppDataContext } from '../..';
import {
  ErrorComponent,
  ROUTE as ERROR_ROUTE,
} from '../ErrorComponent/ErrorComponent';
import {
  RedirectOnLoad,
  ROUTE as HOME_ROUTE,
} from '../RedirectOnLoad/RedirectOnLoad';
import { ROUTE as FORM_ROUTE, VideoForm } from '../VideoForm/VideoForm';
import { ROUTE as PLAYER_ROUTE, VideoPlayer } from '../VideoPlayer/VideoPlayer';

export const AppRoutes = () => {
  return (
    <MemoryRouter>
      <Switch>
        <Route
          exact
          path={PLAYER_ROUTE()}
          render={() => (
            <AppDataContext.Consumer>
              {({ video }) => <VideoPlayer video={video} />}
            </AppDataContext.Consumer>
          )}
        />
        <Route
          exact
          path={FORM_ROUTE()}
          render={() => (
            <AppDataContext.Consumer>
              {({ jwt, video }) => <VideoForm jwt={jwt} video={video} />}
            </AppDataContext.Consumer>
          )}
        />
        <Route
          exact
          path={ERROR_ROUTE()}
          render={({ match }) => <ErrorComponent code={match.params.code} />}
        />
        <Route path={HOME_ROUTE()} component={RedirectOnLoad} />
      </Switch>
    </MemoryRouter>
  );
};
