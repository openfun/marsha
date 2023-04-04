import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/utils/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { ToolsAndApplications } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
  }),
}));

describe('<ToolsAndApplications />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the widget', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    expect(screen.getByText('Tools and Applications')).toBeInTheDocument();
    expect(screen.getByText('Enable chat')).toBeInTheDocument();
    expect(screen.getByText('Enable shared notes')).toBeInTheDocument();
    expect(screen.getByText('Enable waiting room')).toBeInTheDocument();
    expect(screen.getByText('Enable recordings')).toBeInTheDocument();
  });

  it('updates the classroom enable_chat on toggle click', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_chat: false,
    });
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    const toggleEnableChat = screen.getByRole('checkbox', {
      name: 'Enable chat',
    });
    expect(toggleEnableChat).toBeChecked();
    userEvent.click(toggleEnableChat);

    expect(await screen.findByText('Classroom updated.')).toBeInTheDocument();
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: '{"enable_chat":false}',
    });
  });

  it('updates the classroom enable_shared_notes on toggle click', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_shared_notes: false,
    });
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    const toggleEnableSharedNotes = screen.getByRole('checkbox', {
      name: 'Enable shared notes',
    });
    expect(toggleEnableSharedNotes).toBeChecked();
    userEvent.click(toggleEnableSharedNotes);

    expect(await screen.findByText('Classroom updated.')).toBeInTheDocument();
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: '{"enable_shared_notes":false}',
    });
  });

  it('updates the classroom enable_waiting_room on toggle click', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_waiting_room: true,
    });
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    const toggleEnableWaitingRoom = screen.getByRole('checkbox', {
      name: 'Enable waiting room',
    });
    expect(toggleEnableWaitingRoom).not.toBeChecked();
    userEvent.click(toggleEnableWaitingRoom);

    expect(await screen.findByText('Classroom updated.')).toBeInTheDocument();
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: '{"enable_waiting_room":true}',
    });
  });

  it('updates the classroom enable_recordings on toggle click', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_recordings: false,
    });
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    const toggleEnableRecordings = screen.getByRole('checkbox', {
      name: 'Enable recordings',
    });
    expect(toggleEnableRecordings).toBeChecked();
    userEvent.click(toggleEnableRecordings);

    expect(await screen.findByText('Classroom updated.')).toBeInTheDocument();
    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: '{"enable_recordings":false}',
    });
  });

  it('fails to udpate the classroom', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    fetchMock.patch('/api/classrooms/1/', 500);
    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <ToolsAndApplications />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    const toggleEnableRecordings = screen.getByRole('checkbox', {
      name: 'Enable recordings',
    });
    expect(toggleEnableRecordings).toBeChecked();
    userEvent.click(toggleEnableRecordings);

    expect(
      await screen.findByText('Classroom not updated!'),
    ).toBeInTheDocument();
    expect(toggleEnableRecordings).toBeChecked();
  });
});
