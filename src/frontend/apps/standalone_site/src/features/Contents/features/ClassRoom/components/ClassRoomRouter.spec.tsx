import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ClassRoomRouter from './ClassRoomRouter';

jest.mock('./Read/ClassRooms', () => ({
  __esModule: true,
  default: ({ playlistId }: { playlistId: string }) => (
    <div>My ClassroomsRead {playlistId}</div>
  ),
}));

jest.mock('./Manage/ClassroomManage', () => ({
  __esModule: true,
  default: () => (
    <div>
      <p>My ClassroomManage</p>
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

  it('renders route /my-contents/classroom?playlist=test-playlist-id', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        componentPath: '/my-contents/classroom/*',
        history: ['/my-contents/classroom?playlist=test-playlist-id'],
      },
    });
    expect(screen.getByText(/My ClassroomManage/i)).toBeInTheDocument();
    expect(
      screen.getByText(/My ClassroomsRead test-playlist-id/i),
    ).toBeInTheDocument();
  });

  it('renders classroom no match', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        componentPath: '/my-contents/classroom/*',
        history: ['/my-contents/classroom/some/bad/route'],
      },
    });
    expect(screen.queryByText(/My ClassroomManage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/My ClassroomsRead/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sorry, this page does not exist./i),
    ).toBeInTheDocument();
  });

  it('renders create classroom', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        componentPath: '/my-contents/classroom/*',
        history: ['/my-contents/classroom/create'],
      },
    });
    expect(screen.getByText(/My ClassroomManage/i)).toBeInTheDocument();
    expect(screen.getByText(/My ClassroomsRead/i)).toBeInTheDocument();
  });

  it('renders update classroom', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        componentPath: '/my-contents/classroom/*',
        history: ['/my-contents/classroom/123456'],
      },
    });
    expect(screen.getByText('My ClassRoomUpdate')).toBeInTheDocument();
    expect(screen.queryByText('Invited')).not.toBeInTheDocument();
  });

  it('renders invite classroom', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        componentPath: '/my-contents/classroom/*',
        history: ['/my-contents/classroom/123456/invite/123456'],
      },
    });
    expect(screen.getByText('My ClassRoomUpdate')).toBeInTheDocument();
  });

  it('renders invite classroom without inviteId', () => {
    render(<ClassRoomRouter />, {
      routerOptions: {
        componentPath: '/my-contents/classroom/*',
        history: ['/my-contents/classroom/123456/invite/'],
      },
    });
    expect(
      screen.getByText(/Sorry, this page does not exist./i),
    ).toBeInTheDocument();
  });
});
