import {
  ErrorComponents,
  MarkdownDocument,
  appState,
  builderFullScreenErrorRoute,
  flags,
  useAppConfig,
  useCurrentResourceContext,
  useJwt,
} from 'lib-components';
import {
  MARKDOWN_EDITOR_ROUTE,
  MARKDOWN_NOT_FOUND_ROUTE,
  MARKDOWN_VIEWER_ROUTE,
} from 'lib-markdown';
import { Navigate } from 'react-router-dom';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';
import { useIsFeatureEnabled } from 'data/hooks/useIsFeatureEnabled';

import { MARKDOWN_WIZARD_ROUTE } from '../MarkdownWizard/route';

type RedirectOnLoadProps = {
  markdownDocument?: MarkdownDocument;
};

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = ({ markdownDocument }: RedirectOnLoadProps) => {
  const appData = useAppConfig();
  const isFeatureEnabled = useIsFeatureEnabled();

  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Navigate to={builderFullScreenErrorRoute(ErrorComponents.lti)} />;
  }

  if (!isFeatureEnabled(flags.MARKDOWN)) {
    return <Navigate to={MARKDOWN_NOT_FOUND_ROUTE()} />;
  }

  if (appData.state === appState.PORTABILITY) {
    return <Navigate to={RESOURCE_PORTABILITY_REQUEST_ROUTE} />;
  }

  // Deal with missing JWT (the resource may be not available yet)
  if (!useJwt.getState().getJwt()) {
    return <Navigate to={MARKDOWN_NOT_FOUND_ROUTE()} />;
  }

  const [context] = useCurrentResourceContext();

  if (context.permissions.can_update) {
    const isNewDocument =
      markdownDocument?.translations.length === 0 ||
      markdownDocument?.translations.reduce(
        (acc, translation) => acc && translation.title === '',
        true,
      ) ||
      false;

    if (isNewDocument) {
      return <Navigate to={MARKDOWN_WIZARD_ROUTE()} />;
    }
    return <Navigate to={MARKDOWN_EDITOR_ROUTE()} />;
  } else {
    return <Navigate to={MARKDOWN_VIEWER_ROUTE()} />;
  }
};
