import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { InstructorWrapper } from '.';

jest.mock('components/InstructorView/index', () => {
  return {
    InstructorView: ({ children }: { children: React.ReactNode }) => (
      <div>
        <span>InstructorView</span>
        {children}
      </div>
    ),
  };
});

describe('<InstructorWrapper />', () => {
  const video = videoMockFactory();

  it('wraps its children in an instructor view if the current user is an instructor', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: {
            can_access_dashboard: true,
          },
        } as any),
    });

    const { getByText, getByTitle } = render(
      <InstructorWrapper resource={video}>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    getByText('InstructorView');
    getByTitle('some-child');
  });

  it('just renders the children if the current user is not an instructor', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: {
            can_access_dashboard: false,
          },
        } as any),
    });

    const { getByTitle, queryByText } = render(
      <InstructorWrapper resource={video}>
        <div title="some-child" />
      </InstructorWrapper>,
    );

    expect(queryByText('InstructorView')).toBeNull();
    getByTitle('some-child');
  });
});
