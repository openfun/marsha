import { useCurrentResourceContext, videoMockFactory } from 'lib-components';
import React from 'react';

import render from 'utils/tests/render';

import { InstructorWrapper } from '.';

jest.mock('components/InstructorWrapper/InstructorView', () => {
  return {
    InstructorView: ({ children }: { children: React.ReactNode }) => (
      <div>
        <span>InstructorView</span>
        {children}
      </div>
    ),
  };
});

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<InstructorWrapper />', () => {
  const video = videoMockFactory();

  it('wraps its children in an instructor view if the current user is an instructor', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: true,
        },
      },
    ] as any);

    const { getByText, getByTitle } = render(
      <InstructorWrapper resource={video}>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    getByText('InstructorView');
    getByTitle('some-child');
  });

  it('just renders the children if the current user is not an instructor', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
        },
      },
    ] as any);

    const { getByTitle, queryByText } = render(
      <InstructorWrapper resource={video}>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    expect(queryByText('InstructorView')).toBeNull();
    getByTitle('some-child');
  });
});
