import React from 'react';

import { getDecodedJwt } from '../../data/appData';
import { InstructorView } from '../InstructorView';

interface InstructorWrapperProps {
  children: React.ReactNode;
}

export const InstructorWrapper = ({ children }: InstructorWrapperProps) => {
  if (getDecodedJwt().permissions.can_update) {
    return <InstructorView>{children}</InstructorView>;
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};
