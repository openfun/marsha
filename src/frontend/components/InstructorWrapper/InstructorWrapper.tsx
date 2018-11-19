import * as React from 'react';

import { appState } from '../../types/AppData';
import { AppDataContext } from '../App/App';
import { InstructorView } from '../InstructorView/InstructorView';

export const InstructorWrapper = (props: { children: React.ReactNode }) => (
  <AppDataContext.Consumer>
    {({ state }) =>
      state === appState.INSTRUCTOR ? (
        <InstructorView>{props.children}</InstructorView>
      ) : (
        props.children
      )
    }
  </AppDataContext.Consumer>
);
