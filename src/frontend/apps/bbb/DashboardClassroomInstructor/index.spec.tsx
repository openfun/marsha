import fetchMock from 'fetch-mock';
import { act, fireEvent, screen } from '@testing-library/react';
import React from 'react';

import { classroomMockFactory } from 'apps/bbb/utils/tests/factories';
import { Deferred } from 'utils/tests/Deferred';
import render from 'utils/tests/render';

import DashboardClassroomInstructor from '.';

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  },
}));

jest.mock('apps/bbb/data/bbbAppData', () => ({
  bbbAppData: {
    modelName: 'classrooms',
    classroom: {
      id: '1',
    },
  },
}));

jest.mock('apps/bbb/DashboardClassroomForm', () => () => <p>classroom form</p>);

jest.mock('apps/bbb/DashboardClassroomInfos', () => () => (
  <p>classroom infos</p>
));

describe('<DashboardClassroomInstructor />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('Displays message and triggers callbacks depending on classroom state', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    const joinClassroomAction = jest.fn();
    const classroomEnded = jest.fn();

    const { findByText, getByText, rerender } = render(
      <DashboardClassroomInstructor
        classroom={classroom}
        joinedAs={false}
        joinClassroomAction={joinClassroomAction}
        classroomEnded={classroomEnded}
      />,
    );

    await findByText('classroom form');
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
    await findByText('classroom infos');
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
    getByText('You have joined the classroom as John Doe.');
    const cancelButton = screen.queryByText('Join classroom');
    expect(cancelButton).toBeNull();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/end/', deferredPatch.promise);

    fireEvent.click(screen.getByText('End classroom'));
    await act(async () =>
      deferredPatch.resolve({ message: 'classroom ended' }),
    );
    await findByText('Ending classroom…');

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/end/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    expect(classroomEnded).toHaveBeenCalledTimes(1);
  });
});
