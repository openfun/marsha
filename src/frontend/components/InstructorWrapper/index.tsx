import React from 'react';

import { appData } from '../../data/appData';
import { InstructorView } from '../InstructorView';

interface InstructorWrapperProps {
  children: React.ReactNode;
}

export const InstructorWrapper = ({ children }: InstructorWrapperProps) => {
  if (appData.isEditable) {
    return <InstructorView>{children}</InstructorView>;
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};
