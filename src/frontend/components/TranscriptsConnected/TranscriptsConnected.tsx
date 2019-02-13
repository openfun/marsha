import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { RootState } from '../../data/rootReducer';
import { getTimedTextTrackLanguageChoices } from '../../data/timedTextTrackLanguageChoices/action';
import { appStateSuccess } from '../../types/AppData';
import { Transcripts } from '../Transcripts/Transcripts';

const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  jwt: state.context.jwt,
  languageChoices: state.languageChoices.items,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  getTimedTextTrackLanguageChoices: (jwt: string) =>
    dispatch(getTimedTextTrackLanguageChoices(jwt)),
});

/**
 * Component. Displays one TimedTextTrack as part of a list of TimedTextTracks. Provides buttons for
 * the user to delete it or replace the linked video.
 * @param deleteTimedTextTrackRecord Action creator that takes a timedtexttrack to remove from the store.
 * @param jwt The token that will be used to interact with the API.
 * @param track The timedtexttrack to display.
 */
export const TranscriptsConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(Transcripts);
