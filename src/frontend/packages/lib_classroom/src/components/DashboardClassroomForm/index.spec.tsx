import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { ResponsiveContext } from 'grommet';
import { render } from 'lib-tests';
import { Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/utils/tests/factories';

import DashboardClassroomForm from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
  }),
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

describe('<DashboardClassroomForm />', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('creates and renders a classroom form', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    render(
      <ResponsiveContext.Provider value="large">
        <DashboardClassroomForm classroom={classroom} />
      </ResponsiveContext.Provider>,
    );

    expect(
      screen.getByRole('tab', { name: 'Configuration' }),
    ).toBeInTheDocument();
  });

  it('selects the configuration tab by default', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    render(
      <ResponsiveContext.Provider value="large">
        <DashboardClassroomForm classroom={classroom} />
      </ResponsiveContext.Provider>,
    );

    // The configuration tab is the one that contains the widgets, so we just have to detect the
    // Description widget to be sure that we're on the right one.
    expect(
      screen.getByRole('textbox', { name: 'Description' }),
    ).toBeInTheDocument();
  });
});
