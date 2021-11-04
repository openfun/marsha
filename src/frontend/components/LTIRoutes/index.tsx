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
import { LTIUploadHandlers } from '../UploadManager/LTIUploadHandlers';
import { PLAYER_ROUTE } from '../routes';
import { PLAYLIST_ROUTE } from '../PlaylistPortability/route';
import { PlaylistPortability } from '../PlaylistPortability';
import { PUBLIC_JITSI_ROUTE } from '../PublicVideoLiveJitsi/route';
import { RedirectOnLoad } from '../RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from '../RedirectOnLoad/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { UploadForm } from '../UploadForm';
import { UploadManager } from '../UploadManager';
import { SELECT_CONTENT_ROUTE } from '../SelectContent/route';
import { SelectContent } from '../SelectContent/';
import { SUBSCRIBE_SCHEDULED_ROUTE } from '../SubscribeScheduledVideo/route';
import { WaitingLiveVideo } from '../WaitingLiveVideo';

const Dashboard = lazy(() => import('../Dashboard'));
const DashboardDocument = lazy(() => import('../DashboardDocument'));
const DashboardVideo = lazy(() => import('../DashboardVideo'));
const DocumentPlayer = lazy(() => import('../DocumentPlayer'));
const PublicVideoDashboard = lazy(() => import('../PublicVideoDashboard'));
const PublicVideoLiveJitsi = lazy(() => import('../PublicVideoLiveJitsi'));
const SubscribeScheduledVideo = lazy(
  () => import('../SubscribeScheduledVideo'),
);

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => (
  <MemoryRouter>
    <UploadManager>
      <LTIUploadHandlers />
      <div className={`marsha-${appData.frontend}`}>{children}</div>
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
                  <PublicVideoDashboard
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
          path={PUBLIC_JITSI_ROUTE()}
          render={() => {
            if (appData.modelName === modelName.VIDEOS && appData.video?.xmpp) {
              return <PublicVideoLiveJitsi video={appData.video} />;
            }
            return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
          }}
        />
        <Route
          exact
          path={SELECT_CONTENT_ROUTE()}
          render={() => (
            <SelectContent
              playlist={appData.playlist}
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
                  <Chat video={appData.video} standalone={true} />
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
                <Dashboard object={appData.document!}>
                  <DashboardDocument document={appData.document!} />
                </Dashboard>
              );
            }

            if (appData.modelName === modelName.VIDEOS) {
              return (
                <Dashboard object={appData.video!}>
                  <DashboardVideo video={appData.video!} />
                </Dashboard>
              );
            }

            return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
          }}
        />
        <Route
          exact
          path={PLAYLIST_ROUTE()}
          render={() => {
            if (appData.modelName === modelName.DOCUMENTS) {
              return (
                <Dashboard object={appData.document!}>
                  <PlaylistPortability object={appData.document!} />
                </Dashboard>
              );
            }

            if (appData.modelName === modelName.VIDEOS) {
              return (
                <Dashboard object={appData.video!}>
                  <PlaylistPortability object={appData.video!} />
                </Dashboard>
              );
            }

            return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
          }}
        />

        <Route
          exact
          path={SUBSCRIBE_SCHEDULED_ROUTE()}
          render={() => {
            if (
              appData.modelName === modelName.VIDEOS &&
              appData.video!.starting_at 
            ) {
              if (appData.video!.is_scheduled) {
                return <SubscribeScheduledVideo video={appData.video!} />;
              }
              return <WaitingLiveVideo video={appData.video!} />;
            }
            return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
          }}
        />

        <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
      </Switch>
    </Suspense>
  </Wrappers>
);
