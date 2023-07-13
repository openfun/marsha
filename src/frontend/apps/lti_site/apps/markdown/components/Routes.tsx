import { lazyImport } from 'lib-common';
import {
  ErrorComponents,
  FULL_SCREEN_ERROR_ROUTE,
  FullScreenError,
  Loader,
  UploadManager,
  WithParams,
  builderFullScreenErrorRoute,
  useAppConfig,
} from 'lib-components';
import {
  MARKDOWN_EDITOR_ROUTE,
  MARKDOWN_NOT_FOUND_ROUTE,
  MARKDOWN_VIEWER_ROUTE,
} from 'lib-markdown';
import { Suspense } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import { MarkdownAppData } from 'apps/markdown/data/MarkdownAppData';
import { PortabilityRequest } from 'components/PortabilityRequest';
import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

import { MARKDOWN_WIZARD_ROUTE } from './MarkdownWizard/route';
import { RedirectOnLoad } from './RedirectOnLoad';
import { REDIRECT_ON_LOAD_ROUTE } from './RedirectOnLoad/route';

const { MarkdownWizard } = lazyImport(() => import('./MarkdownWizard'));
const { MarkdownEditor, MarkdownNotFoundView, MarkdownViewer } = lazyImport(
  () => import('lib-markdown'),
);

const RoutesMarkdown = () => {
  const appData = useAppConfig();
  const markdownDocument = MarkdownAppData.markdownDocument;

  return (
    <Suspense fallback={<Loader />}>
      <MemoryRouter>
        <UploadManager>
          <Routes>
            <Route
              path={MARKDOWN_WIZARD_ROUTE()}
              element={
                <MarkdownWizard markdownDocumentId={markdownDocument.id} />
              }
            />

            <Route
              path={MARKDOWN_EDITOR_ROUTE()}
              element={
                <MarkdownEditor markdownDocumentId={markdownDocument.id} />
              }
            />

            <Route
              path={MARKDOWN_VIEWER_ROUTE()}
              element={<MarkdownViewer markdownDocument={markdownDocument} />}
            />

            <Route
              path={MARKDOWN_NOT_FOUND_ROUTE()}
              element={<MarkdownNotFoundView />}
            />

            <Route
              path={RESOURCE_PORTABILITY_REQUEST_ROUTE}
              element={
                appData.portability ? (
                  <PortabilityRequest portability={appData.portability} />
                ) : (
                  <Navigate
                    to={builderFullScreenErrorRoute(ErrorComponents.notFound)}
                  />
                )
              }
            />

            <Route
              path={FULL_SCREEN_ERROR_ROUTE.default}
              element={
                <WithParams>
                  {({ code }) => (
                    <FullScreenError code={code as ErrorComponents} />
                  )}
                </WithParams>
              }
            />

            <Route
              path={REDIRECT_ON_LOAD_ROUTE()}
              element={<RedirectOnLoad markdownDocument={markdownDocument} />}
            />
          </Routes>
        </UploadManager>
      </MemoryRouter>
    </Suspense>
  );
};

export default RoutesMarkdown;
