import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider } from 'lib-components';
import { render } from 'lib-tests';
import { Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { Invite } from '.';

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

describe('<Invite />', () => {
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

  it('renders the widget', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      public_token: '1',
      instructor_token: '2',
    });

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Invite />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    // We only verify that the widget is correctly loaded because
    // the behaviour is already tested in DashboardCopyClipBoard.
    expect(screen.getByText('Invite')).toBeInTheDocument();
    expect(
      screen.getByText('LTI link for this classroom:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('https://localhost/my-contents/classroom/1/invite/1'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('https://localhost/my-contents/classroom/1/invite/2'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('https://localhost/lti/classrooms/1'),
    ).toBeInTheDocument();
  });
});
