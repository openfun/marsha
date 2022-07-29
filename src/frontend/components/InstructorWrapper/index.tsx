import React from 'react';

import { InstructorView } from 'components/InstructorView';
import { useJwt } from 'data/stores/useJwt';
import { Document } from 'types/file';
import { Video } from 'types/tracks';

interface InstructorWrapperProps {
  children: React.ReactNode;
  resource: Video | Document;
}

export const InstructorWrapper = ({
  children,
  resource,
}: InstructorWrapperProps) => {
  const getDecodedJwt = useJwt((state) => state.getDecodedJwt);

  if (getDecodedJwt().permissions.can_access_dashboard) {
    return <InstructorView resource={resource}>{children}</InstructorView>;
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};
