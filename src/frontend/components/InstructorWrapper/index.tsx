import React from 'react';

import { appData } from '../../data/appData';
import { appState } from '../../types/AppData';
import { InstructorView } from '../InstructorView';

interface InstructorWrapperProps {
  children: React.ReactNode;
}

export const InstructorWrapper = ({ children }: InstructorWrapperProps) => {
  if (appData.state === appState.INSTRUCTOR) {
    return <InstructorView>{children}</InstructorView>;
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};
