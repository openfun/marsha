import { render } from '@testing-library/react';
import React from 'react';

import { InstructorWrapper } from './';
import { videoMockFactory } from '../../utils/tests/factories';

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

let mockCanAccessDashboard: boolean;
jest.mock('../../data/appData', () => ({
  getDecodedJwt: () => ({
    permissions: {
      can_access_dashboard: mockCanAccessDashboard,
    },
  }),
}));

describe('<InstructorWrapper />', () => {
  const video = videoMockFactory();
  it('wraps its children in an instructor view if the current user is an instructor', () => {
    mockCanAccessDashboard = true;
    const { getByText, getByTitle } = render(
      <InstructorWrapper resource={video}>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    getByText('InstructorView');
    getByTitle('some-child');
  });

  it('just renders the children if the current user is not an instructor', () => {
    mockCanAccessDashboard = false;
    const { getByTitle, queryByText } = render(
      <InstructorWrapper resource={video}>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    expect(queryByText('InstructorView')).toBeNull();
    getByTitle('some-child');
  });
});
