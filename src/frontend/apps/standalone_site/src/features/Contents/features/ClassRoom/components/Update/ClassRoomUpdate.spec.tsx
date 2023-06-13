import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import {
  ltiPublicTokenMockFactory,
  ResourceContext,
  useJwt,
} from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import { useParams } from 'react-router-dom';

import { getFullThemeExtend } from 'styles/theme.extend';

import ClassRoomUpdate from './ClassRoomUpdate';

const fullTheme = getFullThemeExtend();

let resourceContextSpy: ResourceContext;
jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  CurrentResourceContextProvider: ({
    value,
    children,
  }: {
    value: ResourceContext;
    children: React.ReactNode;
  }) => {
    resourceContextSpy = value;
    return <div>{children}</div>;
  },
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

  test('ressource if viewer invited', () => {
    render(<ClassRoomUpdate />);

    expect(screen.getByText(/My DashboardClassroom/i)).toBeInTheDocument();
    expect(resourceContextSpy.permissions.can_access_dashboard).toBeFalsy();
    expect(resourceContextSpy.permissions.can_update).toBeFalsy();
  });

  test('ressource if moderator invited', () => {
    useJwt.setState({
      jwt: 'some token',
      internalDecodedJwt: ltiPublicTokenMockFactory(
        {},
        { can_access_dashboard: true, can_update: true },
      ),
    });

    render(<ClassRoomUpdate />);

    expect(screen.getByText(/My DashboardClassroom/i)).toBeInTheDocument();
    expect(resourceContextSpy.permissions.can_access_dashboard).toBeTruthy();
    expect(resourceContextSpy.permissions.can_update).toBeTruthy();
  });
});
