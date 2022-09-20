import { useJwt } from 'lib-components';
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

describe('<InstructorView />', () => {
  const video = videoMockFactory();

  it('renders the instructor controls', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          maintenance: false,
          permissions: {
            can_update: true,
          },
        } as any),
    });

    const { getByText } = render(
      <InstructorView resource={video}>
        <div className="some-child" />
      </InstructorView>,
    );

    getByText('Instructor Preview 👆');
    getByText('Dashboard');
  });

  it('removes the button when permissions.can_update is set to false', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          maintenance: false,
          permissions: {
            can_update: false,
          },
        } as any),
    });

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
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          maintenance: true,
          permissions: {
            can_update: true,
          },
        } as any),
    });

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
