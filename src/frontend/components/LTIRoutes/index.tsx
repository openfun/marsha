import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Redirect, Route, Switch } from 'react-router-dom';

import { appData } from '../../data/appData';
import { modelName } from '../../types/models';
import { Chat } from '../Chat';
import { CHAT_ROUTE } from '../Chat/route';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { FullScreenError } from '../ErrorComponents';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { ErrorComponentsProps } from '../ErrorComponents';
import { InstructorWrapper } from '../InstructorWrapper';
import { Loader } from '../Loader';
import { RedirectOnLoad } from '../RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from '../RedirectOnLoad/route';
import { PLAYER_ROUTE } from '../routes';
import { SelectContent } from '../SelectContent/';
import { SELECT_CONTENT_ROUTE } from '../SelectContent/route';
import { UploadForm } from '../UploadForm';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { UploadManager } from '../UploadManager';
import { LTIUploadHandlers } from '../UploadManager/LTIUploadHandlers';

const Dashboard = lazy(() => import('../Dashboard'));
const DocumentPlayer = lazy(() => import('../DocumentPlayer'));
const VideoPlayer = lazy(() => import('../VideoPlayer'));

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => (
  <MemoryRouter>
    <UploadManager>
      <LTIUploadHandlers />
      {children}
    </UploadManager>
  </MemoryRouter>
);

export const Routes = () => (
  <Wrappers>
    <Suspense fallback={<Loader />}>
      <Switch>
        <Route
          exact
          path={PLAYER_ROUTE()}
          render={({ match }) => {
            if (match.params.objectType === modelName.VIDEOS && appData.video) {
              return (
                <InstructorWrapper resource={appData.video}>
                  <VideoPlayer
                    video={appData.video}
                    playerType={appData.player!}
                  />
                </InstructorWrapper>
              );
            }

            if (
              match.params.objectType === modelName.DOCUMENTS &&
              appData.document
            ) {
              return (
                <InstructorWrapper resource={appData.document}>
                  <DocumentPlayer document={appData.document} />
                </InstructorWrapper>
              );
            }

            return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
          }}
        />
        <Route
          exact
          path={SELECT_CONTENT_ROUTE()}
          render={() => (
            <SelectContent
              documents={appData.documents}
              videos={appData.videos}
              new_document_url={appData.new_document_url}
              new_video_url={appData.new_video_url}
              lti_select_form_action_url={appData.lti_select_form_action_url!}
              lti_select_form_data={appData.lti_select_form_data!}
            />
          )}
        />
        <Route
          exact
          path={CHAT_ROUTE()}
          render={() => {
            if (appData.modelName === modelName.VIDEOS && appData.video?.xmpp) {
              return (
                <InstructorWrapper resource={appData.video}>
                  <Chat xmpp={appData.video.xmpp} />
                </InstructorWrapper>
              );
            }

            return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
          }}
        />
        <Route
          exact
          path={UPLOAD_FORM_ROUTE()}
          render={({ match }) => (
            <UploadForm
              objectId={match.params.objectId!}
              objectType={match.params.objectType as modelName}
            />
          )}
        />
        <Route
          exact
          path={FULL_SCREEN_ERROR_ROUTE()}
          render={({ match }) => (
            <FullScreenError
              code={match.params.code as ErrorComponentsProps['code']}
            />
          )}
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

            return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
          }}
        />
        <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
      </Switch>
    </Suspense>
  </Wrappers>
);
