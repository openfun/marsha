import React, { Suspense } from 'react';
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

import {
  MARKDOWN_EDITOR_ROUTE,
  MARKDOWN_NOT_FOUND_ROUTE,
  MARKDOWN_VIEWER_ROUTE,
} from 'lib-markdown';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';
import { MARKDOWN_WIZARD_ROUTE } from './MarkdownWizard/route';
import { lazyImport } from 'lib-common';
import { MarkdownAppData } from 'apps/markdown/data/MarkdownAppData';

const { MarkdownWizard } = lazyImport(() => import('./MarkdownWizard'));
const { MarkdownEditor, MarkdownNotFoundView, MarkdownViewer } = lazyImport(
  () => import('lib-markdown'),
);

const Routes = () => {
  const appData = useAppConfig();
  const markdownDocument = MarkdownAppData.markdownDocument;

  return (
    <Suspense fallback={<Loader />}>
      <MemoryRouter>
        <UploadManager>
          <Route
            exact
            path={MARKDOWN_WIZARD_ROUTE()}
            render={() => (
              <MarkdownWizard markdownDocumentId={markdownDocument.id} />
            )}
          />

          <Route
            exact
            path={MARKDOWN_EDITOR_ROUTE()}
            render={() => (
              <MarkdownEditor markdownDocumentId={markdownDocument.id} />
            )}
          />

          <Route
            exact
            path={MARKDOWN_VIEWER_ROUTE()}
            render={() => (
              <MarkdownViewer markdownDocument={markdownDocument} />
            )}
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

          <Route
            path={REDIRECT_ON_LOAD_ROUTE()}
            render={() => (
              <RedirectOnLoad
                isNewDocument={markdownDocument.translations.length === 0}
              />
            )}
          />
        </UploadManager>
      </MemoryRouter>
    </Suspense>
  );
};

export default Routes;
