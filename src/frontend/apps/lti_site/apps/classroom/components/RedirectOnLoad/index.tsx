import { DASHBOARD_CLASSROOM_ROUTE } from 'lib-classroom';
import {
  ErrorComponents,
  appState,
  builderFullScreenErrorRoute,
  flags,
  useAppConfig,
  useFlags,
} from 'lib-components';
import { Navigate } from 'react-router-dom';

import { RESOURCE_PORTABILITY_REQUEST_ROUTE } from 'components/PortabilityRequest/route';

// RedirectOnLoad assesses the initial state of the application using appData and determines the proper
// route to load in the Router
export const RedirectOnLoad = () => {
  const appData = useAppConfig();
  const isFlagEnabled = useFlags((state) => state.isFlagEnabled);

  // Get LTI errors out of the way
  if (appData.state === appState.ERROR) {
    return <Navigate to={builderFullScreenErrorRoute(ErrorComponents.lti)} />;
  }

  if (!isFlagEnabled(flags.CLASSROOM)) {
    return (
      <Navigate to={builderFullScreenErrorRoute(ErrorComponents.notFound)} />
    );
  }

  if (appData.state === appState.PORTABILITY) {
    return <Navigate to={RESOURCE_PORTABILITY_REQUEST_ROUTE} />;
  }

  return <Navigate to={DASHBOARD_CLASSROOM_ROUTE} />;
};
