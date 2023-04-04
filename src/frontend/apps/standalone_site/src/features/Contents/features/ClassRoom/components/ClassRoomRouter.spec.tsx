import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ClassRoomRouter from './ClassRoomRouter';

jest.mock('./Read/ClassRooms', () => ({
  __esModule: true,
  default: () => <div>My ClassroomsRead</div>,
}));

jest.mock('./Update/ClassRoomUpdate', () => ({
  __esModule: true,
  default: () => (
    <div>
      <p>My ClassRoomUpdate</p>
    </div>
  ),
}));

describe('<ClassRoomRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render classroom', () => {
    render(<ClassRoomRouter />, {
      routerOptions: { history: ['/my-contents/classroom'] },
    });
    expect(screen.getByText('Classrooms')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Classroom' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My ClassroomsRead/i)).toBeInTheDocument();
  });

  test('render classroom no match', () => {
    render(<ClassRoomRouter />, {
      routerOptions: { history: ['/some/bad/route'] },
    });
    expect(
      screen.getByRole('button', { name: 'Create Classroom' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My ClassroomsRead/i)).toBeInTheDocument();
  });

  test('render create classroom', async () => {
    render(<ClassRoomRouter />, {
      routerOptions: { history: ['/my-contents/classroom/create'] },
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

  test('render update classroom', () => {
    render(<ClassRoomRouter />, {
      routerOptions: { history: ['/my-contents/classroom/123456'] },
    });
    expect(screen.getByText('My ClassRoomUpdate')).toBeInTheDocument();
    expect(screen.queryByText('Invited')).not.toBeInTheDocument();
  });

  test('render invite classroom', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        history: ['/my-contents/classroom/123456/invite/123456'],
      },
    });
    expect(screen.getByText('My ClassRoomUpdate')).toBeInTheDocument();
  });

  test('render invite classroom without inviteId', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        history: ['/my-contents/classroom/123456/invite/'],
      },
    });
    expect(screen.getByText(/My ClassroomsRead/i)).toBeInTheDocument();
  });
});
