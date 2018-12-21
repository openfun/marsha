import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { InstructorView } from '../InstructorView/InstructorView';

export const mapStateToProps = (state: RootState) => ({
  videoId:
    (state &&
      state.context.ltiResourceVideo &&
      state.context.ltiResourceVideo.id) ||
    null,
});

export const InstructorViewConnected = connect(mapStateToProps)(InstructorView);
