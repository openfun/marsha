import { screen } from '@testing-library/react';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { useJwt } from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';
import { classroomMockFactory } from 'utils';

import { wrapInClassroom } from 'utils/wrapInClassroom';

import { ClassroomWidgetProvider } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    static: { img: { liveBackground: 'some_url' } },
  }),
}));

const currentDate = DateTime.fromISO('2022-01-13T12:00');

describe('<ClassroomWidgetProvider />', () => {
  beforeEach(() => {
    useJwt.getState().setJwt('some token');
  });

  afterEach(() => fetchMock.restore());

  it('renders widgets', () => {
    const classroomId = faker.datatype.uuid();
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
      screen.getByRole('textbox', { name: 'Description' }),
    ).toBeInTheDocument();

  });
});
