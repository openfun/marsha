import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Redirect, Route, Switch } from 'react-router-dom';

import { appData } from 'data/appData';
import { modelName } from 'types/models';
import { Chat } from 'components/Chat';
import { CHAT_ROUTE } from 'components/Chat/route';
import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FullScreenError } from 'components/ErrorComponents';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { ErrorComponentsProps } from 'components/ErrorComponents';
import { InstructorWrapper } from 'components/InstructorWrapper';
import { Loader } from 'components/Loader';
import { LTIUploadHandlers } from 'components/UploadManager/LTIUploadHandlers';
import { PLAYER_ROUTE } from 'components/routes';
import { PLAYLIST_ROUTE } from 'components/PlaylistPortability/route';
import { PlaylistPortability } from 'components/PlaylistPortability';
import { PUBLIC_JITSI_ROUTE } from 'components/PublicVideoLiveJitsi/route';
import { RedirectOnLoad } from 'components/RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from 'components/RedirectOnLoad/route';
import { UPLOAD_FORM_ROUTE } from 'components/UploadForm/route';
import { UploadForm } from 'components/UploadForm';
import { UploadManager } from 'components/UploadManager';
import { SELECT_CONTENT_ROUTE } from 'components/SelectContent/route';
import { SelectContent } from 'components/SelectContent/';
import { SUBSCRIBE_SCHEDULED_ROUTE } from 'components/SubscribeScheduledVideo/route';
import { WaitingLiveVideo } from 'components/WaitingLiveVideo';

const Dashboard = lazy(() => import('components/Dashboard'));
const DashboardDocument = lazy(() => import('components/DashboardDocument'));
const DashboardVideo = lazy(() => import('components/DashboardVideo'));
const DocumentPlayer = lazy(() => import('components/DocumentPlayer'));
const PublicVideoDashboard = lazy(
  () => import('components/PublicVideoDashboard'),
);
const PublicVideoLiveJitsi = lazy(
  () => import('components/PublicVideoLiveJitsi'),
);
const SubscribeScheduledVideo = lazy(
  () => import('components/SubscribeScheduledVideo'),
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
              return <WaitingLiveVideo />;
            }
            return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
          }}
        />

        <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
      </Switch>
    </Suspense>
  </Wrappers>
);
