import { screen } from '@testing-library/react';
import { ResponsiveContext } from 'grommet';
import { render } from 'lib-tests';
import React from 'react';
import { useParams } from 'react-router-dom';

import { getFullThemeExtend } from 'styles/theme.extend';

import ClassRoomUpdate from './ClassRoomUpdate';

const fullTheme = getFullThemeExtend();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useRouteMatch: () => ({ url: '/my-contents/classroom/123456' }),
}));

const mockUseParams = useParams as jest.MockedFunction<
  typeof useParams<{ classroomId: string }>
>;

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

  test('render with classroomId', () => {
    mockUseParams.mockReturnValue({
      classroomId: '123456',
    });
    render(<ClassRoomUpdate />);

    expect(screen.getByText(/My DashboardClassroom/i)).toBeInTheDocument();
  });

  test('render small screen', () => {
    mockUseParams.mockReturnValue({
      classroomId: '123456',
    });

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
});
