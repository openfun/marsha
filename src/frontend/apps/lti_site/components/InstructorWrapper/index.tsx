import { Document, Video, useCurrentResourceContext } from 'lib-components';
import React from 'react';

import { InstructorView } from './InstructorView';

interface InstructorWrapperProps {
  children: React.ReactNode;
  resource: Video | Document;
}

export const InstructorWrapper = ({
  children,
  resource,
}: InstructorWrapperProps) => {
  const [context] = useCurrentResourceContext();

  if (context.permissions.can_access_dashboard) {
    return <InstructorView resource={resource}>{children}</InstructorView>;
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};
