import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import {
  addResource,
  deleteResource,
} from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { TimedTextListItem } from '../TimedTextListItem/TimedTextListItem';

const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  jwt: state.context.jwt,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  deleteTimedTextTrackRecord: (timedtexttrack: TimedText) =>
    dispatch(deleteResource(modelName.TIMEDTEXTTRACKS, timedtexttrack)),
  updateTimedTextTrackRecord: (timedtexttrack: TimedText) =>
    dispatch(addResource(modelName.TIMEDTEXTTRACKS, timedtexttrack)),
});

/**
 * Component. Displays one TimedTextTrack as part of a list of TimedTextTracks. Provides buttons for
 * the user to delete it or replace the linked video.
 * @param deleteTimedTextTrackRecord Action creator that takes a timedtexttrack to remove from the store.
 * @param jwt The token that will be used to interact with the API.
 * @param track The timedtexttrack to display.
 */
export const TimedTextListItemConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(TimedTextListItem);
