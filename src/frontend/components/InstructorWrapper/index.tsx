import React from 'react';

import { getDecodedJwt } from '../../data/appData';
import { InstructorView } from '../InstructorView';
import { Document } from '../../types/file';
import { Video } from '../../types/tracks';

interface InstructorWrapperProps {
  children: React.ReactNode;
  resource: Video | Document;
}

export const InstructorWrapper = ({
  children,
  resource,
}: InstructorWrapperProps) => {
  if (getDecodedJwt().permissions.can_access_dashboard) {
    return <InstructorView resource={resource}>{children}</InstructorView>;
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};
