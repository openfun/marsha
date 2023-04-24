import { screen } from '@testing-library/react';
import { InfoWidgetModalProvider } from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import {
  classroomMockFactory,
  classroomSharedNoteMockFactory,
} from '@lib-classroom/utils/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { SharedNotes } from '.';

describe('<SharedNotes />', () => {
  it('displays a list of available shared notes', () => {
    let classroom = classroomMockFactory({ id: '1', started: false });
    const classroomSharedNotes = [
      classroomSharedNoteMockFactory({
        updated_on:
          DateTime.fromJSDate(new Date(2022, 1, 29, 11, 0, 0)).toISO() ||
          undefined,
      }),
      classroomSharedNoteMockFactory({
        updated_on:
          DateTime.fromJSDate(new Date(2022, 1, 15, 11, 0, 0)).toISO() ||
          undefined,
      }),
    ];

    const { rerender } = render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <SharedNotes />,
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    expect(screen.getByText('Shared notes')).toBeInTheDocument();
    expect(screen.getByText('No shared note available')).toBeInTheDocument();

    // simulate updated classroom
    classroom = {
      ...classroom,
      shared_notes: classroomSharedNotes,
    };
    rerender(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <SharedNotes />,
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );
    expect(
      screen.queryByText('No shared note available'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, March 1, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, February 15, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
  });
});
