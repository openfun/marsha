import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { appState } from '../../types/AppData';
import { RedirectOnLoad } from '../RedirectOnLoad/RedirectOnLoad';

/**
 * Simply pick the video & ltiState statically from the context.
 */
export const mapStateToProps = (state: RootState<appState>) => ({
  ltiState: state.context.ltiState,
  video: state.context.ltiResourceVideo,
});

/**
 * Component. Analyzes the initial state of the application and redirects the user to the
 * most relevant view.
 */
export const RedirectOnLoadConnected = connect(mapStateToProps)(RedirectOnLoad);
