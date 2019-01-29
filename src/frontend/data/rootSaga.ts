import { all } from 'redux-saga/effects';

import { getResourceListSaga } from './sagas/getResourceList';

// Aggregate all our sagas through the parallelization effect
export function* rootSaga() {
  yield all([getResourceListSaga()]);
}
