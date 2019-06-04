import { all } from 'redux-saga/effects';

import { getTimedTextTrackLanguageChoicesSaga } from './sagas/getTimedTextTrackLanguageChoices';

// Aggregate all our sagas through the parallelization effect
export function* rootSaga() {
  yield all([getTimedTextTrackLanguageChoicesSaga()]);
}
