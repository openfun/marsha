import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { render, Deferred } from 'lib-tests';
import { Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/utils/tests/factories';

import DashboardClassroomForm from './index';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
    static: {
      img: {
        bbbBackground: 'some_url',
      },
    },
  }),
}));

jest.mock('components/UploadDocuments', () => ({
  UploadDocuments: () => <p>Upload Documents.</p>,
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

  it('creates a classroom with updated values', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    const { rerender } = render(
      <DashboardClassroomForm classroom={classroom} />,
    );
    screen.getByText('Title');
    screen.getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.clear(inputTitle);
    userEvent.type(inputTitle, 'updated title');
    fireEvent.blur(inputTitle);

    // simulate updated classroom
    rerender(
      <DashboardClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
        }}
      />,
    );

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    userEvent.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: classroom.welcome_text.length,
    });

    // wait for debounce to update the classroom
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      title: 'updated title',
      welcomeText: 'updated welcome text',
    });
    jest.runAllTimers();

    // simulate updated classroom
    rerender(
      <DashboardClassroomForm
        classroom={{
          ...classroom,
          title: 'updated title',
          welcome_text: 'updated welcome text',
        }}
      />,
    );

    fireEvent.click(screen.getByText('Launch the classroom now in BBB'));
    deferredPatch.resolve({ message: 'Classroom created.' });

    await waitFor(() => {
      expect(fetchMock.calls()).toHaveLength(3);
    });

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        title: 'updated title',
      }),
    });

    expect(fetchMock.calls()[1]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[1]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        welcome_text: 'updated welcome text',
      }),
    });

    expect(fetchMock.lastCall()![0]).toEqual('/api/classrooms/1/create/');
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        ...classroom,
        title: 'updated title',
        welcome_text: 'updated welcome text',
      }),
    });
  });

  it('shows an error when classroom title is missing', () => {
    const classroom = classroomMockFactory({ title: null, id: '1' });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    render(<DashboardClassroomForm classroom={classroom} />);

    // title empty, error message should be shown
    screen.getByText('Title is required to launch the classroom.');
    const launchButton = screen.getByText('Launch the classroom now in BBB');
    expect(launchButton).toBeDisabled();

    // title filled, error message should be hidden
    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    userEvent.type(inputTitle, 'updated title');
    const titleError = screen.queryByText(
      'Title is required to launch the classroom.',
    );
    expect(titleError).not.toBeInTheDocument();
  });
});
