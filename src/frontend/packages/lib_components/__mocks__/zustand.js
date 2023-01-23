// https://github.com/pmndrs/zustand/wiki/Testing
const actualCreate = jest.requireActual('zustand').create;
import { act } from 'react-dom/test-utils';

// a variable to hold reset functions for all stores declared in the app
const storeResetFns = new Set();

const stores = new Set();

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (createState) => {
  if (!createState) return create;
  const store = actualCreate(createState);
  const initialState = store.getState();
  storeResetFns.add(() => {
    if (initialState) {
      Object.keys(initialState).forEach((key) => {
        if (Array.isArray(initialState[key])) {
          initialState[key] = [];
        }
      });
    }
    store.setState(initialState, true);
  });

  stores.add(store);

  return store;
};

// Reset all stores after each test run
afterEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => resetFn());
  });
});
