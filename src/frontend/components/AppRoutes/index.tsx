import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Redirect, Route, Switch } from 'react-router-dom';

import { appData } from '../../data/appData';
import { createPlayer } from '../../Player/createPlayer';
import { modelName } from '../../types/models';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ErrorComponent } from '../ErrorComponent';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { InstructorWrapper } from '../InstructorWrapper';
import { Loader } from '../Loader';
import { RedirectOnLoad } from '../RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from '../RedirectOnLoad/route';
import { PLAYER_ROUTE } from '../routes';
import { UploadForm } from '../UploadForm';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';

const Dashboard = lazy(() => import('../Dashboard'));
const DocumentPlayer = lazy(() => import('../DocumentPlayer'));
const VideoPlayer = lazy(() => import('../VideoPlayer'));

export const AppRoutes = () => (
  <MemoryRouter>
    <Suspense fallback={<Loader />}>
      <Switch>
        <Route
          exact
          path={PLAYER_ROUTE()}
          render={({ match }) => {
            if (match.params.objectType === modelName.VIDEOS && appData.video) {
              return (
                <InstructorWrapper>
                  <VideoPlayer
                    video={appData.video}
                    createPlayer={createPlayer}
                  />
                </InstructorWrapper>
              );
            }

            if (
              match.params.objectType === modelName.DOCUMENTS &&
              appData.document
            ) {
              return (
                <InstructorWrapper>
                  <DocumentPlayer document={appData.document} />
                </InstructorWrapper>
              );
            }

            return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
          }}
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
          render={() => {
            if (appData.modelName === modelName.DOCUMENTS) {
              return (
                <Dashboard
                  document={appData.document!}
                  objectType={modelName.DOCUMENTS}
                />
              );
            }

            if (appData.modelName === modelName.VIDEOS) {
              return (
                <Dashboard
                  video={appData.video!}
                  objectType={modelName.VIDEOS}
                />
              );
            }

            return <Redirect push to={ERROR_COMPONENT_ROUTE('notFound')} />;
          }}
        />
        <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
      </Switch>
    </Suspense>
  </MemoryRouter>
);
