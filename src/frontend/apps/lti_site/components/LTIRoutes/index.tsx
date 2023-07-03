import {
  builderFullScreenErrorRoute,
  DASHBOARD_ROUTE,
  ErrorComponents,
  FULL_SCREEN_ERROR_ROUTE,
  FullScreenError,
  Loader,
  modelName,
  UPLOAD_FORM_ROUTE,
  UploadForm,
  UploadHandlers,
  UploadManager,
  useAppConfig,
  WithParams,
} from 'lib-components';
import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import { InstructorWrapper } from 'components/InstructorWrapper';
import { PLAYLIST_ROUTE } from 'components/PlaylistPortability/route';
import { PortabilityRequest } from 'components/PortabilityRequest';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';
import { RedirectOnLoad } from 'components/RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from 'components/RedirectOnLoad/route';
import { PLAYER_ROUTE, VIDEO_WIZARD_ROUTE } from 'components/routes';
import { SelectContent } from 'components/SelectContent';
import { SELECT_CONTENT_ROUTE } from 'components/SelectContent/route';

const Dashboard = lazy(() => import('components/Dashboard'));
const VideoWizard = lazy(() => import('components/VideoWizard'));
const DocumentPlayer = lazy(
  () => import('components/DashboardDocument/DocumentPlayer'),
);
const PlaylistPage = lazy(() => import('components/PlaylistPage'));
const PublicVideoDashboard = lazy(
  () => import('components/PublicVideoDashboard'),
);

/***
 * When the component Routes is called first time, no path is specified. Given the fact that all
 * routes match exact path except the last one, this is the last route which will be reached.
 * This route is the loading route, which will redirect the user on the exact path he needs
 * to match, depending on the state of his appData object.
 */
const LTIRoutes = () => {
  return (
    <MemoryRouter>
      <LTIInnerRoutes />
    </MemoryRouter>
  );
};

export const LTIInnerRoutes = () => {
  const appData = useAppConfig();
  const routeNotFound = builderFullScreenErrorRoute(ErrorComponents.notFound);

  return (
    <UploadManager>
      <UploadHandlers />
      <div className={`marsha-${appData.frontend}`}>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path={DASHBOARD_ROUTE.default} element={<Dashboard />} />

            <Route path={PLAYER_ROUTE.all}>
              <Route
                path={PLAYER_ROUTE.videos}
                element={
                  appData?.video ? (
                    <InstructorWrapper resource={appData.video}>
                      <PublicVideoDashboard
                        video={appData.video}
                        playerType={appData.player!}
                      />
                    </InstructorWrapper>
                  ) : (
                    <Navigate to={routeNotFound} />
                  )
                }
              />
              <Route
                path={PLAYER_ROUTE.documents}
                element={
                  appData.document ? (
                    <InstructorWrapper resource={appData.document}>
                      <DocumentPlayer document={appData.document} />
                    </InstructorWrapper>
                  ) : (
                    <Navigate to={routeNotFound} />
                  )
                }
              />
              <Route path="*" element={<Navigate to={routeNotFound} />} />
            </Route>

            <Route path={VIDEO_WIZARD_ROUTE.all} element={<VideoWizard />} />

            <Route
              path={RESOURCE_PORTABILITY_REQUEST_ROUTE}
              element={
                <PortabilityRequest portability={appData.portability!} />
              }
            />

            <Route
              path={SELECT_CONTENT_ROUTE}
              element={
                <SelectContent
                  playlist={appData.playlist}
                  documents={appData.documents}
                  videos={appData.videos}
                  webinars={appData.webinars}
                  new_document_url={appData.new_document_url}
                  new_video_url={appData.new_video_url}
                  new_webinar_url={appData.new_webinar_url}
                  lti_select_form_action_url={
                    appData.lti_select_form_action_url!
                  }
                  lti_select_form_data={appData.lti_select_form_data!}
                  targeted_resource={appData.targeted_resource}
                />
              }
            />

            <Route
              path={UPLOAD_FORM_ROUTE.default}
              element={
                <WithParams>
                  {({ objectId, objectType }) => (
                    <UploadForm
                      objectId={objectId!}
                      objectType={objectType as modelName}
                    />
                  )}
                </WithParams>
              }
            />

            <Route path={FULL_SCREEN_ERROR_ROUTE.all}>
              {Object.values(FULL_SCREEN_ERROR_ROUTE.codes).map((code) => (
                <Route
                  key={code}
                  path={code}
                  element={<FullScreenError code={code as ErrorComponents} />}
                />
              ))}
              <Route path="*" element={<Navigate to={routeNotFound} />} />
            </Route>

            <Route path={PLAYLIST_ROUTE.default} element={<PlaylistPage />} />

            <Route path={REDIRECT_ON_LOAD_ROUTE} element={<RedirectOnLoad />} />

            <Route path="*" element={<Navigate to={routeNotFound} />} />
          </Routes>
        </Suspense>
      </div>
    </UploadManager>
  );
};

export default LTIRoutes;
