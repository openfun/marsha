import { createStore } from 'redux';

import { rootReducer } from './rootReducer';

export const bootstrapStore = () => createStore(rootReducer);
