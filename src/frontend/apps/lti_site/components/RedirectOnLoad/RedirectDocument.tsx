import {
  Document,
  ErrorComponents,
  builderDashboardRoute,
  builderFullScreenErrorRoute,
  modelName,
  useCurrentResourceContext,
} from 'lib-components';
import { Navigate } from 'react-router-dom';

import { builderPlayerRoute } from 'components/routes';

interface RedirectDocumentProps {
  document: Document;
}

export const RedirectDocument = ({ document }: RedirectDocumentProps) => {
  const [context] = useCurrentResourceContext();

  if (document.is_ready_to_show) {
    return <Navigate to={builderPlayerRoute(modelName.DOCUMENTS)} />;
  }

  if (context.permissions.can_update) {
    return <Navigate to={builderDashboardRoute(modelName.DOCUMENTS)} />;
  }

  // For safety default to the 404 view: this is for users without update permission
  // when the document is not ready to show.
  return (
    <Navigate to={builderFullScreenErrorRoute(ErrorComponents.notFound)} />
  );
};
