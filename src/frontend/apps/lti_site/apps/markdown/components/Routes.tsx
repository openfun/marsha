import React, { lazy, Suspense } from 'react';
import { MemoryRouter, Route } from 'react-router-dom';

import {
  Loader,
  ErrorComponentsProps,
  FullScreenError,
  FULL_SCREEN_ERROR_ROUTE,
  UploadManager,
} from 'lib-components';

import { MARKDOWN_EDITOR_ROUTE } from './MarkdownEditor/route';
import { MARKDOWN_NOT_FOUND_ROUTE } from './MarkdownNotFoundView/route';
import { MARKDOWN_VIEWER_ROUTE } from './MarkdownViewer/route';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';

const MarkdownNotFoundView = lazy(() => import('./MarkdownNotFoundView'));
const MarkdownEditor = lazy(() => import('./MarkdownEditor'));
const MarkdownViewer = lazy(() => import('./MarkdownViewer'));

const Routes = () => {
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
