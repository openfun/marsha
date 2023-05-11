import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ClassRoomRouter from './ClassRoomRouter';

jest.mock('./Read/ClassRooms', () => ({
  __esModule: true,
  default: ({ playlistId }: { playlistId: string }) => (
    <div>My ClassroomsRead {playlistId}</div>
  ),
}));

jest.mock('./Create/ClassRoomCreate', () => ({
  __esModule: true,
  default: () => (
    <div>
      <p>My ClassRoomCreate</p>
    </div>
  ),
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

  test('render route /my-contents/classroom?playlist=test-playlist-id', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        history: ['/my-contents/classroom?playlist=test-playlist-id'],
      },
    });
    expect(screen.getByText(/My ClassRoomCreate/i)).toBeInTheDocument();
    expect(
      screen.getByText(/My ClassroomsRead test-playlist-id/i),
    ).toBeInTheDocument();
  });

  test('render classroom no match', () => {
    render(<ClassRoomRouter />, {
      routerOptions: { history: ['/some/bad/route'] },
    });
    expect(screen.queryByText(/My ClassRoomCreate/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/My ClassroomsRead/i)).not.toBeInTheDocument();
  });

  test('render create classroom', () => {
    render(<ClassRoomRouter />, {
      routerOptions: { history: ['/my-contents/classroom/create'] },
    });
    expect(screen.getByText(/My ClassRoomCreate/i)).toBeInTheDocument();
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
