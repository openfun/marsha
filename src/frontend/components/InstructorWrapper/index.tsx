import React from 'react';
import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { appState, appStateSuccess } from '../../types/AppData';
import { InstructorView } from '../InstructorView';

interface BaseInstructorWrapperProps {
  children: React.ReactNode;
  ltiState: appState;
}

const BaseInstructorWrapper = ({
  children,
  ltiState,
}: BaseInstructorWrapperProps) => {
  if (ltiState === appState.INSTRUCTOR) {
    return <InstructorView>{children}</InstructorView>;
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};

/**
 * Simply pick the ltiState statically from the context.
 */
const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  ltiState: state.context.ltiState,
});

/**
 * Component. Wraps its children components into an InstructorView if the current
 * user is an instructor, and just renders the children otherwise.
 */
export const InstructorWrapper = connect(mapStateToProps)(
  BaseInstructorWrapper,
);
