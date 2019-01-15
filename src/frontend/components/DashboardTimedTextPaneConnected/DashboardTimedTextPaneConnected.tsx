import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { addMultipleResources } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { DashboardTimedTextPane } from '../DashboardTimedTextPane/DashboardTimedTextPane';

const mapStateToProps = (state: RootState) => ({
  jwt: state.context.jwt,
});

/** Create a function that adds a bunch of timedtexttracks in the store. */
const mapDispatchToProps = (dispatch: Dispatch) => ({
  addAllTimedTextTracks: (timedtexttracks: TimedText[]) =>
    dispatch(addMultipleResources(modelName.TIMEDTEXTTRACKS, timedtexttracks)),
});

/**
 * Component. Displays the complete timedtexttrack management area in the dashboard, that lets the user
 * create, delete and modify timedtexttracks related to their video.
 */
export const DashboardTimedTextPaneConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(DashboardTimedTextPane);
