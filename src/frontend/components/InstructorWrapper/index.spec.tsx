import { render } from '@testing-library/react';
import React from 'react';

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

let mockCanUpdate: boolean;
jest.mock('../../data/appData', () => ({
  getDecodedJwt: () => ({
    permissions: {
      can_update: mockCanUpdate,
    },
  }),
}));

describe('<InstructorWrapper />', () => {
  it('wraps its children in an instructor view if the current user is an instructor', () => {
    mockCanUpdate = true;
    const { getByText, getByTitle } = render(
      <InstructorWrapper>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    getByText('InstructorView');
    getByTitle('some-child');
  });

  it('just renders the children if the current user is not an instructor', () => {
    mockCanUpdate = false;
    const { getByTitle, queryByText } = render(
      <InstructorWrapper>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    expect(queryByText('InstructorView')).toBeNull();
    getByTitle('some-child');
  });
});
