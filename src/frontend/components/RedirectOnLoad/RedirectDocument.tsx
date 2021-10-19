import React from 'react';
import { Redirect } from 'react-router-dom';

import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { PLAYER_ROUTE } from '../routes';
import { getDecodedJwt } from '../../data/appData';
import { modelName } from '../../types/models';
import { Document } from '../../types/file';

interface RedirectDocumentProps {
  document: Document;
}

export const RedirectDocument = ({ document }: RedirectDocumentProps) => {
  if (document.is_ready_to_show) {
    return <Redirect push to={PLAYER_ROUTE(modelName.DOCUMENTS)} />;
  }

  if (getDecodedJwt().permissions.can_update) {
    return <Redirect push to={DASHBOARD_ROUTE(modelName.DOCUMENTS)} />;
  }

  // For safety default to the 404 view: this is for users without update permission
  // when the document is not ready to show.
  return <Redirect push to={FULL_SCREEN_ERROR_ROUTE('notFound')} />;
};
