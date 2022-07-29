/*
 This is the base component for Markdown management,
 according to permission it displays the Markdown
 editor or the content viewer.

 This might be done at the "Route" level, but it may
 allow to put some code in common between the editor
 and the viewer.
 */

import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { DecodedJwt } from 'types/jwt';
import { OrganizationAccessRole } from 'types/User';
import { Nullable } from 'utils/types';

import MarkdownEditor from 'apps/markdown/MarkdownEditor';
import MarkdownNotFoundView from 'apps/markdown/MarkdownNotFoundView';
import MarkdownViewer from 'apps/markdown/MarkdownViewer';

const MarkdownView = () => {
  const getDecodedJwt = useJwt((state) => state.getDecodedJwt);
  let decodedJwt: Nullable<DecodedJwt>;
  try {
    decodedJwt = getDecodedJwt();
  } catch (error) {
    // This may happen when the resource is not yet available
    decodedJwt = null;
  }

  if (decodedJwt) {
    const userHasEditionRole =
      (decodedJwt.roles.includes(OrganizationAccessRole.ADMINISTRATOR) ||
        decodedJwt.roles.includes(OrganizationAccessRole.INSTRUCTOR)) &&
      decodedJwt.permissions.can_update;

    if (userHasEditionRole) {
      return <MarkdownEditor />;
    } else {
      return <MarkdownViewer />;
    }
  }

  // If we are here, there has been some error before : display a basic error message
  return <MarkdownNotFoundView />;
};

export default MarkdownView;
