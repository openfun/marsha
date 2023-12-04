import { screen } from '@testing-library/react';
import { useCurrentResourceContext } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

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

    render(
      <InstructorWrapper resource={video}>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    screen.getByText('InstructorView');
    expect(screen.getByTitle('some-child')).toBeInTheDocument();
  });

  it('just renders the children if the current user is not an instructor', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: false,
        },
      },
    ] as any);

    render(
      <InstructorWrapper resource={video}>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    expect(screen.queryByText('InstructorView')).toBeNull();
    screen.getByTitle('some-child');
  });
});
