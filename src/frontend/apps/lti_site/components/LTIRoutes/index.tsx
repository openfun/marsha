import {
  Loader,
  FullScreenError,
  FULL_SCREEN_ERROR_ROUTE,
  ErrorComponentsProps,
  UploadForm,
  UPLOAD_FORM_ROUTE,
  UploadManager,
  UploadHandlers,
  useAppConfig,
  modelName,
} from 'lib-components';
import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Redirect, Route, Switch } from 'react-router-dom';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
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

const Wrappers = ({ children }: React.PropsWithChildren<{}>) => {
  const appData = useAppConfig();

  return (
    <MemoryRouter>
      <UploadManager>
        <UploadHandlers />
        <div className={`marsha-${appData.frontend}`}>{children}</div>
      </UploadManager>
    </MemoryRouter>
  );
};
/***
 * When the component Routes is called first time, no path is specified. Given the fact that all
 * routes match exact path except the last one, this is the last route which will be reached.
 * This route is the loading route, which will redirect the user on the exact path he needs
 * to match, depending on the state of his appData object.
 */
const Routes = () => {
  const appData = useAppConfig();

  return (
    <Wrappers>
      <Suspense fallback={<Loader />}>
        <Switch>
          <Route exact path={DASHBOARD_ROUTE()} component={Dashboard} />

          <Route
            exact
            path={PLAYER_ROUTE()}
            render={({ match }) => {
              if (
                match.params.objectType === modelName.VIDEOS &&
                appData.video
              ) {
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

          <Route path={VIDEO_WIZARD_ROUTE()} component={VideoWizard} />

          <Route
            exact
            path={RESOURCE_PORTABILITY_REQUEST_ROUTE()}
            render={() => (
              <PortabilityRequest portability={appData.portability!} />
            )}
          />

          <Route
            exact
            path={SELECT_CONTENT_ROUTE()}
            render={() => (
              <SelectContent
                playlist={appData.playlist}
                documents={appData.documents}
                videos={appData.videos}
                webinars={appData.webinars}
                new_document_url={appData.new_document_url}
                new_video_url={appData.new_video_url}
                new_webinar_url={appData.new_webinar_url}
                lti_select_form_action_url={appData.lti_select_form_action_url!}
                lti_select_form_data={appData.lti_select_form_data!}
                targeted_resource={appData.targeted_resource}
              />
            )}
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

          <Route exact path={PLAYLIST_ROUTE()} component={PlaylistPage} />

          <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
        </Switch>
      </Suspense>
    </Wrappers>
  );
};

export default Routes;
