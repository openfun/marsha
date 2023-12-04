import { Classroom } from 'lib-components';
import React, { ReactNode } from 'react';

import { CurrentClassroomProvider } from '@lib-classroom/hooks';

export const wrapInClassroom = (component: ReactNode, classroom: Classroom) => {
  return (
    <CurrentClassroomProvider value={classroom}>
      {component}
    </CurrentClassroomProvider>
  );
};
