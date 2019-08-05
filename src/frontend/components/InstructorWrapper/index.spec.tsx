import { render } from '@testing-library/react';
import React from 'react';

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
  it('wraps its children in an instructor view if the current user is an instructor', () => {
    mockState = appState.INSTRUCTOR;
    const { getByText, getByTitle } = render(
      <InstructorWrapper>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    getByText('InstructorView');
    getByTitle('some-child');
  });

  it('just renders the children if the current user is not an instructor', () => {
    mockState = appState.STUDENT;
    const { getByTitle, queryByText } = render(
      <InstructorWrapper>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    expect(queryByText('InstructorView')).toBeNull();
    getByTitle('some-child');
  });
});
