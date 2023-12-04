import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { report } from 'lib-components';
import { render } from 'lib-tests';
import { Settings } from 'luxon';

import { classroomMockFactory } from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { ClassroomInfoBar } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

describe('<ClassroomInfoBar />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
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

    act(() => {
      titleInput.focus();
    });

    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'new title');

    act(() => {
      titleInput.blur();
    });

    expect(titleInput).toHaveValue('new title');
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/classrooms/${classroom.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'new title',
      }),
    });
    expect(titleInput).toHaveValue('new title');
    screen.getByText('Classroom updated.');
  });

  it('should stop user from entering an empty title', async () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'title',
    });

    render(wrapInClassroom(<ClassroomInfoBar />, classroom));

    const titleInput = screen.getByRole('textbox', {
      name: 'Enter title of your classroom here',
    });

    act(() => {
      titleInput.focus();
    });

    await userEvent.clear(titleInput);

    act(() => {
      titleInput.blur();
    });

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

    await userEvent.type(textInput, ' and more');

    act(() => {
      textInput.blur();
    });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1));
    expect(fetchMock.lastCall()![0]).toEqual(
      `/api/classrooms/${classroom.id}/`,
    );
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
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
