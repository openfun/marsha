import { Nullable } from 'lib-common';
import { Classroom } from 'lib-components';
import { createContext, useContext } from 'react';

const CurrentClassroomContext = createContext<Nullable<Classroom>>(null);

export const CurrentClassroomProvider = CurrentClassroomContext.Provider;
export const useCurrentClassroom = () => {
  const value = useContext(CurrentClassroomContext);
  if (!value) {
    throw new Error(
      `Missing wrapping Provider for Store CurrentClassroomContext`,
    );
  }
  return value;
};
