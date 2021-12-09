import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Navigate,Route, Routes } from 'react-router-dom';

import { appData } from 'data/appData';
import { modelName } from 'types/models';
import { Chat } from 'components/Chat';
import { CHAT_ROUTE } from 'components/Chat/route';
import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FullScreenError } from 'components/ErrorComponents';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
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

const LTIRoutes = () => {

  return (
    <Wrappers>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path={PLAYER_ROUTE()}>
            <Route path={modelName.VIDEOS}>
              {appData.video && (
                <InstructorWrapper resource={appData.video}>
                  <PublicVideoDashboard
                    video={appData.video}
                    playerType={appData.player!}
                  />
                </InstructorWrapper>
              )}

              {!appData.video && (
                <Navigate to={FULL_SCREEN_ERROR_ROUTE('notFound')} />
              )}
            </Route>
            <Route path={modelName.DOCUMENTS}>
              {appData.document && (
                  <InstructorWrapper resource={appData.document}>
                    <DocumentPlayer document={appData.document} />
                  </InstructorWrapper>
              )}

              {!appData.document && (
                <Navigate to={FULL_SCREEN_ERROR_ROUTE('notFound')} />
              )}
            </Route>
          </Route>
          <Route
            path={PUBLIC_JITSI_ROUTE()}
            children={() => {
              if (appData.modelName === modelName.VIDEOS && appData.video?.xmpp) {
                return <PublicVideoLiveJitsi video={appData.video} />;
              }

              return <Navigate to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
            }}
          />
          <Route path={SELECT_CONTENT_ROUTE()} element={
            <SelectContent
                playlist={appData.playlist}
                documents={appData.documents}
                videos={appData.videos}
                new_document_url={appData.new_document_url}
                new_video_url={appData.new_video_url}
                lti_select_form_action_url={appData.lti_select_form_action_url!}
                lti_select_form_data={appData.lti_select_form_data!}
              />
          }/>
          <Route path={CHAT_ROUTE()}>
            {appData.modelName === modelName.VIDEOS && appData.video?.xmpp && (
              <InstructorWrapper resource={appData.video}>
                <Chat video={appData.video} standalone={true} />
              </InstructorWrapper>
            )}

          {(appData.modelName !== modelName.VIDEOS || !appData.video?.xmpp) &&
            (<Navigate to={FULL_SCREEN_ERROR_ROUTE('notFound')} />)
          }
          </Route>
          <Route
            path={UPLOAD_FORM_ROUTE()}
            element={<UploadForm />}
          />
          <Route
            path={FULL_SCREEN_ERROR_ROUTE()}
            element={
              <FullScreenError />
            }
          />
          <Route path={DASHBOARD_ROUTE()} >
            <Route path={modelName.DOCUMENTS}>
              <Dashboard object={appData.document!}>
                <DashboardDocument document={appData.document!} />
              </Dashboard>
            </Route>
            <Route path={modelName.VIDEOS}>
              <Dashboard object={appData.video!}>
                <DashboardVideo video={appData.video!} />
              </Dashboard>
            </Route>
          </Route>
          <Route
            path={PLAYLIST_ROUTE()}
            children={() => {
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

              return <Navigate to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
            }}
          />

          <Route path={SUBSCRIBE_SCHEDULED_ROUTE()} >
            {appData.modelName === modelName.VIDEOS && appData.video!.starting_at && appData.video!.is_scheduled && (
              <SubscribeScheduledVideo video={appData.video!} />
            )}

            {appData.modelName === modelName.VIDEOS && appData.video!.starting_at && !appData.video!.is_scheduled && (
              <WaitingLiveVideo video={appData.video!} />
            )}

            {/* /!\ TODO Manage else cases */}
          </Route>
          <Route path={REDIRECT_ON_LOAD_ROUTE()} element={
            < RedirectOnLoad />
          }/>
        </Routes>
      </Suspense>
    </Wrappers>
  );
};


export default LTIRoutes;