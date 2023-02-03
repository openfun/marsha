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
import { MARKDOWN_NOT_FOUND_ROUTE, MARKDOWN_VIEWER_ROUTE } from 'lib-markdown';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';
import { lazyImport } from 'lib-common';
import { MarkdownAppData } from 'apps/markdown/data/MarkdownAppData';

const { MarkdownNotFoundView, MarkdownViewer } = lazyImport(() => import('lib-markdown'));
const MarkdownEditor = lazy(() => import('./MarkdownEditor'));

const Routes = () => {
  const appData = useAppConfig();
  const markdownDocument = MarkdownAppData.markdownDocument;

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
            render={() => <MarkdownViewer markdownDocument={markdownDocument} />}
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
