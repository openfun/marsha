import * as React from 'react';

import { appState } from '../../types/AppData';
import { InstructorViewConnected } from '../InstructorViewConnected/InstructorViewConnected';

interface InstructorWrapperProps {
  ltiState: appState;
}

export class InstructorWrapper extends React.Component<InstructorWrapperProps> {
  render() {
    const { children, ltiState } = this.props;

    if (ltiState === appState.INSTRUCTOR) {
      return <InstructorViewConnected>{children}</InstructorViewConnected>;
    } else {
      return children;
    }
  }
}
