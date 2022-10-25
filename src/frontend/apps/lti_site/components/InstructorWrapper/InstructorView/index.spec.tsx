import { useCurrentResourceContext, useMaintenance } from 'lib-components';
import React from 'react';

import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { InstructorView } from '.';

jest.mock('jwt-decode', () => jest.fn());

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({
    modelName: 'videos',
  }),
}));

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
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

    const { getByText } = render(
      <InstructorView resource={video}>
        <div className="some-child" />
      </InstructorView>,
    );

    getByText('Instructor Preview 👆');
    getByText('Dashboard');
  });

  it('removes the button when permissions.can_update is set to false', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_update: false,
        },
      },
    ] as any);

    const { getByText, queryByText } = render(
      <InstructorView resource={video}>
        <div className="some-child" />
      </InstructorView>,
    );

    getByText(
      `This video is read-only because it belongs to another course: ${video.playlist.lti_id}`,
    );
    expect(queryByText('Go to Dashboard')).toBeNull();
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

    const { getByText, queryByText } = render(
      <InstructorView resource={video}>
        <div className="some-child" />
      </InstructorView>,
    );

    getByText(
      "The dashboard is undergoing maintenance work, it can't be accessed right now.",
    );
    expect(queryByText('Go to Dashboard')).toBeNull();
  });
});
