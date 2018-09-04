import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom';

import { AppDataContext } from '../..';
import { ErrorComponent } from '../ErrorComponent/ErrorComponent';
import { RedirectOnLoad } from '../RedirectOnLoad/RedirectOnLoad';
import { VideoForm } from '../VideoForm/VideoForm';
import { VideoJsPlayer } from '../VideoJsPlayer/VideoJsPlayer';

export const AppRoutes = () => {
  return (
    <HashRouter>
      <Switch>
        <Route
          exact
          path="/player"
          render={() => (
            <AppDataContext.Consumer>
              {({ video }) => <VideoJsPlayer video={video} />}
            </AppDataContext.Consumer>
          )}
        />
        <Route
          exact
          path="/form"
          render={() => (
            <AppDataContext.Consumer>
              {({ jwt, video }) => <VideoForm jwt={jwt} video={video} />}
            </AppDataContext.Consumer>
          )}
        />
        <Route
          exact
          path="/errors/:code"
          render={({ match }) => <ErrorComponent code={match.params.code} />}
        />
        <Route path="/" component={RedirectOnLoad} />
      </Switch>
    </HashRouter>
  );
};
