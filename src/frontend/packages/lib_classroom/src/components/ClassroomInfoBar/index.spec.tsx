import { getDefaultNormalizer, screen, waitFor } from '@testing-library/react';
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

    render(
      wrapInClassroom(
        <ClassroomInfoBar startDate="2023-01-01T07:00:00Z" />,
        classroom,
      ),
    );
    expect(
      screen.getByText('1/1/2023  ·  8:00:00 AM', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
  });

  it('renders startDate Intl NL - Netherlands', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'title',
    });

    render(
      wrapInClassroom(
        <ClassroomInfoBar startDate="2023-01-01T07:00:00Z" />,
        classroom,
      ),
      {
        intlOptions: { locale: 'nl' },
      },
    );

    expect(
      screen.getByText('1-1-2023  ·  08:00:00', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
  });

  it('renders startDate Intl fr - France', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'title',
    });

    render(
      wrapInClassroom(
        <ClassroomInfoBar startDate="2023-01-01T07:00:00Z" />,
        classroom,
      ),
      {
        intlOptions: { locale: 'fr' },
      },
    );

    expect(
      screen.getByText('01/01/2023  ·  08:00:00', {
        normalizer: getDefaultNormalizer({ collapseWhitespace: false }),
      }),
    ).toBeInTheDocument();
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

    render(
      wrapInClassroom(<ClassroomInfoBar startDate="some date" />, classroom),
    );

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

  it('renders with invalid startDate', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'title',
    });

    render(
      wrapInClassroom(<ClassroomInfoBar startDate="some date" />, classroom),
    );

    expect(screen.getByDisplayValue('title')).toBeInTheDocument();
    expect(screen.queryByText('some date')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalid DateTime')).not.toBeInTheDocument();
  });

  it('should stop user from entering an empty title', () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      title: 'title',
    });

    render(
      wrapInClassroom(<ClassroomInfoBar startDate="some date" />, classroom),
    );

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

    render(
      wrapInClassroom(<ClassroomInfoBar startDate="some date" />, classroom),
    );

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
