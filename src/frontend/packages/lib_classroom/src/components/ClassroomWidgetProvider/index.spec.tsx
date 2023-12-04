import { faker } from '@faker-js/faker';
import { screen, within } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { useCurrentResourceContext, useJwt } from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { ClassroomWidgetProvider } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: { img: { liveBackground: 'some_url' } },
  }),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

const currentDate = DateTime.fromISO('2022-01-13T12:00');

describe('<ClassroomWidgetProvider />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  it('renders widgets', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const classroomId = faker.string.uuid();
    const mockedClassroom = classroomMockFactory({
      id: classroomId,
      title: 'An example title',
      starting_at: currentDate.toString(),
      estimated_duration: '00:30',
      description: 'An example description',
    });

    render(wrapInClassroom(<ClassroomWidgetProvider />, mockedClassroom));

    // Description
    expect(
      await screen.findByRole('textbox', { name: 'Description' }),
    ).toBeInTheDocument();

    // Scheduling
    const inputStartingAtDate = within(
      screen.getByTestId('starting-at-date-picker'),
    ).getByRole('presentation');

    expect(inputStartingAtDate).toHaveTextContent('1/13/2022');

    const inputStartingAtTime = screen.getByLabelText(/starting time/i);
    expect(inputStartingAtTime).toHaveValue('12:00');
    const inputEstimatedDuration = screen.getByLabelText(/estimated duration/i);
    expect(inputEstimatedDuration).toHaveValue('0:30');

    // Invite
    expect(screen.getByText('Invite')).toBeInTheDocument();

    // Upload Documents
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();

    // Recordings
    expect(screen.getByText('Recordings')).toBeInTheDocument();

    // Tools and Applications
    expect(screen.getByText('Tools and Applications')).toBeInTheDocument();
  });
});
