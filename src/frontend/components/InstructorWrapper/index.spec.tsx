import { cleanup, render } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';

import { bootstrapStore } from '../../data/bootstrapStore';
import { appState } from '../../types/AppData';
import { InstructorWrapper } from './index';

jest.mock('../InstructorView/index', () => {
  return {
    InstructorView: ({ children }: { children: React.ReactNode }) => (
      <div>
        <span>InstructorView</span>
        {children}
      </div>
    ),
  };
});

let mockState: appState;
jest.mock('../../data/appData', () => ({
  appData: {
    get state() {
      return mockState;
    },
  },
}));

describe('<InstructorWrapper />', () => {
  afterEach(cleanup);

  const state = {
    state: appState.INSTRUCTOR,
    video: null,
  } as any;

  it('wraps its children in an instructor view if the current user is an instructor', () => {
    mockState = appState.INSTRUCTOR;
    const { getByText, getByTitle } = render(
      <Provider store={bootstrapStore(state)}>
        <InstructorWrapper>
          <div title="some-child" />
        </InstructorWrapper>
      </Provider>,
    );

    getByText('InstructorView');
    getByTitle('some-child');
  });

  it('just renders the children if the current user is not an instructor', () => {
    mockState = appState.STUDENT;
    const { getByTitle, queryByText } = render(
      <Provider store={bootstrapStore(state)}>
        <InstructorWrapper>
          <div title="some-child" />
        </InstructorWrapper>
      </Provider>,
    );

    expect(queryByText('InstructorView')).toBeNull();
    getByTitle('some-child');
  });
});
