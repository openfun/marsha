import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { InstructorView } from '../InstructorView/InstructorView';

export const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  readOnly: state.context.decodedJwt.read_only,
  videoId: state.context.ltiResourceVideo.id,
});

export const InstructorViewConnected = connect(mapStateToProps)(InstructorView);
