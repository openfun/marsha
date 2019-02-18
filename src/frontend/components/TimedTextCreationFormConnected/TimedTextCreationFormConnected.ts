import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { getTimedTextTrackLanguageChoices } from '../../data/timedTextTrackLanguageChoices/action';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { TimedTextCreationForm } from '../TimedTextCreationForm/TimedTextCreationForm';

const mapStateToProps = (state: RootState<appStateSuccess>) => ({
  jwt: state.context.jwt,
  languageChoices: state.languageChoices.items,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  createTimedTextTrack: (timedtexttrack: TimedText) =>
    dispatch(addResource(modelName.TIMEDTEXTTRACKS, timedtexttrack)),
  getTimedTextTrackLanguageChoices: (jwt: string) =>
    dispatch(getTimedTextTrackLanguageChoices(jwt)),
});

/**
 * Component. Displays a form that allows the user to create a new timedtexttrack.
 * @param createTimedTextTrack Action creator that takes a timedtexttrack to insert into the store.
 * @param jwt The token that will be used to interact with the API.
 * @param mode The mode of the timedtexttracks we're creating.
 */
export const TimedTextCreationFormConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(TimedTextCreationForm);
