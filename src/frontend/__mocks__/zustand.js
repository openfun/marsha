// https://github.com/pmndrs/zustand/wiki/Testing
import actualCreate from 'zustand';
import { act } from 'react-dom/test-utils';

// a variable to hold reset functions for all stores declared in the app
const storeResetFns = new Set();

const stores = new Set();

// when creating a store, we get its initial state, create a reset function and add it in the set
const create = (createState) => {
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
    //  remove all listeners
    //  we have to do this in case initial method of a store can throw
    //  because when the state is reset, it will still trigger update on
    //  listening components that may causes the throw to happend.
    stores.forEach((store) => store.destroy());

    storeResetFns.forEach((resetFn) => resetFn());
  });
});

export default create;
