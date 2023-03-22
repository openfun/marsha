import { screen } from '@testing-library/react';
import { InfoWidgetModalProvider } from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import {
  classroomMockFactory,
  classroomRecordingMockFactory,
} from 'utils/tests/factories';
import { wrapInClassroom } from 'utils/wrapInClassroom';

import { Recordings } from '.';

describe('<Recordings />', () => {
  it('displays a list of available recordings', () => {
    let classroom = classroomMockFactory({ id: '1', started: false });
    const classroomRecordings = [
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 29, 11, 0, 0),
        ).toISO(),
      }),
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 15, 11, 0, 0),
        ).toISO(),
      }),
    ];

    const { rerender } = render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Recordings />,
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    expect(screen.getByText('Recordings')).toBeInTheDocument();
    expect(screen.getByText('No recordings available')).toBeInTheDocument();

    // simulate updated classroom
    classroom = {
      ...classroom,
      recordings: classroomRecordings,
    };
    rerender(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Recordings />,
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    expect(
      screen.queryByText('No recordings available'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, March 1, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, February 15, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
  });
});
