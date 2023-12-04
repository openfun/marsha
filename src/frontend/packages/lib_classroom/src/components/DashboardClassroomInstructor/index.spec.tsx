import { fireEvent, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Deferred, render } from 'lib-tests';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/tests/factories';

import DashboardClassroomInstructor from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  }),
}));

jest.mock('components/DashboardClassroomForm', () => {
  const DashboardClassroomForm = () => <p>classroom form</p>;
  return DashboardClassroomForm;
});

jest.mock(
  'components/DashboardClassroomInfos',
  () =>
    ({ inviteToken }: { inviteToken?: string }) => (
      <div>
        <p>classroom infos</p>
        {inviteToken && <p>Invite link</p>}
      </div>
    ),
);

describe('<DashboardClassroomInstructor />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('Displays message and triggers callbacks depending on classroom state', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const joinClassroomAction = jest.fn();
    const classroomEnded = jest.fn();

    const { rerender } = render(
      <DashboardClassroomInstructor
        classroom={classroom}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );

    await screen.findByText('classroom form');
    expect(joinClassroomAction).toHaveBeenCalledTimes(0);
    expect(classroomEnded).toHaveBeenCalledTimes(0);

    // classroom starts
    rerender(
      <DashboardClassroomInstructor
        classroom={{ ...classroom, started: true }}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    await screen.findByText('classroom infos');
    expect(screen.queryByText('Invite link')).not.toBeInTheDocument();
    expect(joinClassroomAction).toHaveBeenCalledTimes(0);
    expect(classroomEnded).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByText('Join classroom'));
    expect(joinClassroomAction).toHaveBeenCalledTimes(1);

    // user joined
    rerender(
      <DashboardClassroomInstructor
        classroom={{ ...classroom, started: true }}
        joinedAs="John Doe"
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );
    screen.getByText('You have joined the classroom as John Doe.');
    const cancelButton = screen.queryByText('Join classroom');
    expect(cancelButton).toBeNull();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/end/', deferredPatch.promise);

    fireEvent.click(screen.getByText('End classroom'));
    deferredPatch.resolve({ message: 'classroom ended' });
    await screen.findByText('Ending classroom…');

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/end/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    expect(classroomEnded).toHaveBeenCalledTimes(1);
  });

  it('Displays invite link depend state', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: true,
      public_token: null,
    });

    const { rerender } = render(
      <DashboardClassroomInstructor
        classroom={classroom}
        joinedAs={false}
        joinClassroomAction={jest.fn()}
        classroomEnded={jest.fn()}
      />,
    );

    expect(screen.queryByText('Invite link')).not.toBeInTheDocument();

    rerender(
      <DashboardClassroomInstructor
        classroom={{ ...classroom, public_token: '1234465' }}
        joinedAs={false}
        joinClassroomAction={jest.fn()}
        classroomEnded={jest.fn()}
      />,
    );

    expect(screen.getByText('Invite link')).toBeInTheDocument();
  });
});
