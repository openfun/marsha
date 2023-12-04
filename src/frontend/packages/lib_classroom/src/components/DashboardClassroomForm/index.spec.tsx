import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { useCurrentResourceContext } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/tests/factories';

import DashboardClassroomForm from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
  }),
  useCurrentResourceContext: jest.fn(),
}));

jest.mock('components/ClassroomWidgetProvider', () => ({
  ClassroomWidgetProvider: () => <p>Classroom widget provider</p>,
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

describe('<DashboardClassroomForm />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });
  it('creates and renders a classroom form', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const classroom = classroomMockFactory({ id: '1', started: false });
    render(
      <ResponsiveContext.Provider value="large">
        <DashboardClassroomForm classroom={classroom} />
      </ResponsiveContext.Provider>,
    );

    expect(
      screen.getByRole('tab', { name: 'Configuration' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Launch the classroom now in BBB' }),
    ).toBeInTheDocument();
  });

  it('selects the configuration tab by default', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const classroom = classroomMockFactory({ id: '1', started: false });
    render(
      <ResponsiveContext.Provider value="large">
        <DashboardClassroomForm classroom={classroom} />
      </ResponsiveContext.Provider>,
    );

    // The configuration tab is the one that contains the widgets, so we just have to detect the
    // Description widget to be sure that we're on the right one.
    expect(
      screen.getByRole('tab', { name: 'Configuration' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Launch the classroom now in BBB' }),
    ).toBeInTheDocument();
  });

  it('creates a classroom when clicking on the launch button', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const classroom = classroomMockFactory({ id: '1', started: false });
    const deferred = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferred.promise);
    render(
      <ResponsiveContext.Provider value="large">
        <DashboardClassroomForm classroom={classroom} />
      </ResponsiveContext.Provider>,
    );

    const launchClassroomButton = screen.getByRole('button', {
      name: 'Launch the classroom now in BBB',
    });

    expect(launchClassroomButton).toBeEnabled();

    await userEvent.click(launchClassroomButton);

    expect(launchClassroomButton).toBeDisabled();

    deferred.resolve({ message: 'it works' });

    await waitFor(() => expect(launchClassroomButton).toBeEnabled());
  });
});
