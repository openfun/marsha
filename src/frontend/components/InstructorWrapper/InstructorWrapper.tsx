import * as React from 'react';

import { appState } from '../../types/AppData';
import { InstructorView } from '../InstructorView';

interface InstructorWrapperProps {
  ltiState: appState;
}

export class InstructorWrapper extends React.Component<InstructorWrapperProps> {
  render() {
    const { children, ltiState } = this.props;

    if (ltiState === appState.INSTRUCTOR) {
      return <InstructorView>{children}</InstructorView>;
    } else {
      return children;
    }
  }
}
