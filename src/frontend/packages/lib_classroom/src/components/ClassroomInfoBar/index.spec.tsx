import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { report } from 'lib-components';
import { render } from 'lib-tests';
import { Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/utils/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { ClassroomInfoBar } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

describe('<ClassroomInfoBar />', () => {
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

  it('renders the component', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'title',
    });

    render(wrapInClassroom(<ClassroomInfoBar />, classroom));
    expect(screen.getByDisplayValue('title')).toBeInTheDocument();
  });

  it('allows you to edit the title', async () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'title',
    });
    fetchMock.patch(`/api/classrooms/${classroom.id}/`, {
      title: 'new title',
    });

    render(wrapInClassroom(<ClassroomInfoBar />, classroom));

    const titleInput = screen.getByRole('textbox', {
      name: 'Enter title of your classroom here',
    });
    titleInput.focus();
    userEvent.clear(titleInput);
    userEvent.type(titleInput, 'new title');
    titleInput.blur();
    expect(titleInput).toHaveValue('new title');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/classrooms/${classroom.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'new title',
      }),
    });
    expect(titleInput).toHaveValue('new title');
    screen.getByText('Classroom updated.');
  });

  it('should stop user from entering an empty title', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'title',
    });

    render(wrapInClassroom(<ClassroomInfoBar />, classroom));

    const titleInput = screen.getByRole('textbox', {
      name: 'Enter title of your classroom here',
    });
    titleInput.focus();
    userEvent.clear(titleInput);
    titleInput.blur();

    expect(titleInput).toHaveValue('title');
    expect(fetchMock.calls()).toHaveLength(0);
    screen.getByText("Title can't be blank!");
  });

  it('modifies the input text, but the backend returns an error', async () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'An existing title',
    });

    fetchMock.patch(`/api/classrooms/${classroom.id}/`, 500);

    render(wrapInClassroom(<ClassroomInfoBar />, classroom));

    const textInput = screen.getByRole('textbox', {
      name: 'Enter title of your classroom here',
    });
    expect(textInput).toHaveValue('An existing title');

    userEvent.type(textInput, ' and more');
    textInput.blur();
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/classrooms/${classroom.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'An existing title and more',
      }),
    });
    expect(textInput).toHaveValue('An existing title');
    expect(report).toHaveBeenCalled();
    screen.getByText('Classroom update has failed!');
  });
});
