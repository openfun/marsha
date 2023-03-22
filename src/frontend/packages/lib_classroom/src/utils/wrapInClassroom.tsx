import { CurrentClassroomProvider } from 'hooks';
import { Classroom } from 'lib-components';
import React, { ReactNode } from 'react';

export const wrapInClassroom = (component: ReactNode, classroom: Classroom) => {
  return (
    <CurrentClassroomProvider value={classroom}>
      {component}
    </CurrentClassroomProvider>
  );
};
