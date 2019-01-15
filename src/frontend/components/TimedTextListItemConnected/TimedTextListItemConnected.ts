import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { deleteResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { TimedTextListItem } from '../TimedTextListItem/TimedTextListItem';

const mapStateToProps = (state: RootState) => ({
  jwt: state.context.jwt,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  deleteTimedTextTrackRecord: (timedtexttrack: TimedText) =>
    dispatch(deleteResource(modelName.TIMEDTEXTTRACKS, timedtexttrack)),
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
