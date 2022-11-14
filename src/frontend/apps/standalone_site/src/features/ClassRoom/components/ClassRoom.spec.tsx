import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { routes } from 'routes';

import ClassRoom from './ClassRoom';

jest.mock('./Read/ClassRooms', () => ({
  __esModule: true,
  default: () => <div>My ClassroomsRead</div>,
}));

jest.mock('./Update/ClassRoomUpdate', () => ({
  __esModule: true,
  default: () => <div>My ClassRoomUpdate</div>,
}));

describe('<ClassRoom/>', () => {
  const classroomRoute = routes.CONTENTS.subRoutes.CLASSROOM;
  const classroomPath = classroomRoute.path;
  const classroomCreatePath = classroomRoute.subRoutes?.CREATE?.path || '';

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render classroom', () => {
    render(<ClassRoom />, { routerOptions: { history: [classroomPath] } });
    expect(screen.getByText('Classrooms')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Classroom' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My Classrooms/i)).toBeInTheDocument();
  });

  test('render classroom no match', () => {
    const badRoute = '/some/bad/route';
    render(<ClassRoom />, { routerOptions: { history: [badRoute] } });
    expect(screen.queryByText('Classrooms')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Create Classroom' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/My Classrooms/i)).not.toBeInTheDocument();
  });

  test('redirect classroom create', async () => {
    render(<ClassRoom />, {
      routerOptions: { history: [classroomCreatePath] },
    });
    expect(screen.getByText('Classrooms')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: 'Create Classroom',
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My ClassroomsRead/i)).toBeInTheDocument();
  });
});
