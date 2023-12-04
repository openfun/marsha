import { screen } from '@testing-library/react';
import { useCurrentResourceContext, useMaintenance } from 'lib-components';
import { videoMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { InstructorView } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'videos',
  }),
  useCurrentResourceContext: jest.fn(),
}));
const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<InstructorView />', () => {
  const video = videoMockFactory();

  it('renders the instructor controls', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: true,
        },
      },
    ] as any);

    render(
      <InstructorView resource={video}>
        <div className="some-child" />
      </InstructorView>,
    );

    screen.getByText('Instructor Preview 👆');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('removes the button when permissions.can_update is set to false', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
      },
    ] as any);

    render(
      <InstructorView resource={video}>
        <div className="some-child" />
      </InstructorView>,
    );

    screen.getByText(
      `This video is read-only because it belongs to another course: ${video.playlist.lti_id}`,
    );
    expect(screen.queryByText('Go to Dashboard')).toBeNull();
  });

  it('removes the button when permissions.maintenance is set to true', () => {
    useMaintenance.setState(() => ({
      isActive: true,
    }));
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: true,
        },
      },
    ] as any);

    render(
      <InstructorView resource={video}>
        <div className="some-child" />
      </InstructorView>,
    );

    screen.getByText(
      "The dashboard is undergoing maintenance work, it can't be accessed right now.",
    );
    expect(screen.queryByText('Go to Dashboard')).toBeNull();
  });
});
