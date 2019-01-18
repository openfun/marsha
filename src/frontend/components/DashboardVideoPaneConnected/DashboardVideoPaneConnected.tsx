import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { Video } from '../../types/tracks';
import { DashboardVideoPane } from '../DashboardVideoPane/DashboardVideoPane';

const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  jwt: state.context.jwt,
});

/** Create a function that updates a single video in the store. */
const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateVideo: (video: Video) => dispatch(addResource(modelName.VIDEOS, video)),
});

/**
 * Component. Displays the "video" part of the Dashboard, including the state of the video in
 * marsha's pipeline. Provides links to the player and to the form to replace the video with another one.
 */
export const DashboardVideoPaneConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(DashboardVideoPane);
