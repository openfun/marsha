import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { useJwt } from 'lib-components';
import { ltiPublicTokenMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import { useParams } from 'react-router-dom';

import { getFullThemeExtend } from 'styles/theme.extend';

import ClassRoomUpdate from './ClassRoomUpdate';

const fullTheme = getFullThemeExtend();

const mockSetCurrentResourceContext = jest.fn();
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useCurrentResourceContext: () => [, mockSetCurrentResourceContext],
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useRouteMatch: () => ({ url: '/my-contents/classroom/123456' }),
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

jest.mock('lib-classroom', () => ({
  ...jest.requireActual('lib-classroom'),
  DashboardClassroom: () => (
    <div className="DashboardClassroomLayout">
      <div>My DashboardClassroom</div>
      <div className="classroom-edit-submit">
        <button>Button DashboardClassroom</button>
      </div>
    </div>
  ),
}));

describe('<ClassRoomUpdate />', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({
      classroomId: '123456',
    });
    useJwt.setState({
      jwt: 'some token',
      internalDecodedJwt: ltiPublicTokenMockFactory(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render', () => {
    useJwt.setState({
      internalDecodedJwt: ltiPublicTokenMockFactory(
        {},
        { can_access_dashboard: true, can_update: true },
      ),
    });

    render(<ClassRoomUpdate />);

    expect(screen.getByText(/My DashboardClassroom/i)).toBeInTheDocument();
    expect(mockSetCurrentResourceContext).toHaveBeenCalledWith({
      isFromWebsite: true,
      permissions: {
        can_access_dashboard: true,
        can_update: true,
      },
      resource_id: '123456',
      roles: [],
    });
  });

  test('render without classroomId', () => {
    mockUseParams.mockReturnValue({
      classroomId: '',
    });

    render(<ClassRoomUpdate />);

    expect(
      screen.queryByText(/My DashboardClassroom/i),
    ).not.toBeInTheDocument();
  });

  test('render small screen', () => {
    render(
      <ResponsiveContext.Provider value="small">
        <ClassRoomUpdate />
      </ResponsiveContext.Provider>,
      {
        grommetOptions: {
          theme: fullTheme,
        },
      },
    );

    expect(
      screen.getByRole('button', { name: 'Button DashboardClassroom' }),
    ).toHaveStyle('width: 75%;');
  });

  test('resource if viewer invited', () => {
    mockUseParams.mockReturnValue({
      classroomId: '123456',
      inviteId: '456789',
    });

    render(<ClassRoomUpdate />);

    expect(screen.getByText(/My DashboardClassroom/i)).toBeInTheDocument();
    expect(mockSetCurrentResourceContext).toHaveBeenCalledWith({
      isFromWebsite: true,
      permissions: {
        can_access_dashboard: false,
        can_update: false,
      },
      resource_id: '123456',
      roles: [],
    });
  });

  test('resource if moderator invited', () => {
    mockUseParams.mockReturnValue({
      classroomId: '123456',
      inviteId: '456789',
    });

    useJwt.setState({
      internalDecodedJwt: ltiPublicTokenMockFactory(
        {},
        { can_access_dashboard: true, can_update: true },
      ),
    });

    render(<ClassRoomUpdate />);

    expect(screen.getByText(/My DashboardClassroom/i)).toBeInTheDocument();
    expect(mockSetCurrentResourceContext).toHaveBeenCalledWith({
      isFromWebsite: true,
      permissions: {
        can_access_dashboard: true,
        can_update: true,
      },
      resource_id: '123456',
      roles: [],
    });
  });
});
