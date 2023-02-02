import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';

import {
  Loader,
  ErrorComponentsProps,
  FullScreenError,
  FULL_SCREEN_ERROR_ROUTE,
  UploadManager,
  useAppConfig,
} from 'lib-components';

import { PortabilityRequest } from 'components/PortabilityRequest';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { MARKDOWN_EDITOR_ROUTE } from './MarkdownEditor/route';
import { MARKDOWN_NOT_FOUND_ROUTE } from 'lib-markdown';
import { MARKDOWN_VIEWER_ROUTE } from './MarkdownViewer/route';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';
import { lazyImport } from 'lib-common';

const { MarkdownNotFoundView } = lazyImport(() => import('lib-markdown'));
const MarkdownEditor = lazy(() => import('./MarkdownEditor'));
const MarkdownViewer = lazy(() => import('./MarkdownViewer'));

const Routes = () => {
  const appData = useAppConfig();

  return (
    <Suspense fallback={<Loader />}>
      <MemoryRouter>
        <UploadManager>
          <Route
            exact
            path={MARKDOWN_EDITOR_ROUTE()}
            render={() => <MarkdownEditor />}
          />

          <Route
            exact
            path={MARKDOWN_VIEWER_ROUTE()}
            render={() => <MarkdownViewer />}
          />

          <Route
            exact
            path={MARKDOWN_NOT_FOUND_ROUTE()}
            render={() => <MarkdownNotFoundView />}
          />

          <Route
            exact
            path={RESOURCE_PORTABILITY_REQUEST_ROUTE()}
            render={() => (
              <PortabilityRequest portability={appData.portability!} />
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

          <Route path={REDIRECT_ON_LOAD_ROUTE()} component={RedirectOnLoad} />
        </UploadManager>
      </MemoryRouter>
    </Suspense>
  );
};

export default Routes;
