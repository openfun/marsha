import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { InstructorWrapper } from '../InstructorWrapper/InstructorWrapper';

/**
 * Simply pick the ltiState statically from the context.
 */
export const mapStateToProps = (state: RootState) => ({
  ltiState: state.context.ltiState,
});

/**
 * Component. Wraps its children components into an InstructorView if the current
 * user is an instructor, and just renders the children otherwise.
 */
export const InstructorWrapperConnected = connect(mapStateToProps)(
  InstructorWrapper,
);
