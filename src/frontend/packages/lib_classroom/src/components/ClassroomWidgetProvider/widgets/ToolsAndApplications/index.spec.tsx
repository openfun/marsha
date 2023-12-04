import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider } from 'lib-components';
import { render } from 'lib-tests';

import { useCurrentClassroom } from '@lib-classroom/hooks/useCurrentClassroom';
import { classroomMockFactory } from '@lib-classroom/tests/factories';

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

jest.mock('@lib-classroom/hooks/useCurrentClassroom', () => ({
  useCurrentClassroom: jest.fn(),
}));
const mockedUseCurrentClassroom = useCurrentClassroom as jest.MockedFunction<
  typeof useCurrentClassroom
>;

describe('<ToolsAndApplications />', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('renders the widget', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    mockedUseCurrentClassroom.mockReturnValue(classroom);

    render(
      <InfoWidgetModalProvider value={null}>
        <ToolsAndApplications />
      </InfoWidgetModalProvider>,
    );

    expect(screen.getByText('Tools and Applications')).toBeInTheDocument();
    expect(screen.getByText('Enable chat')).toBeInTheDocument();
    expect(screen.getByText('Enable shared notes')).toBeInTheDocument();
    expect(screen.getByText('Enable waiting room')).toBeInTheDocument();
    expect(screen.getByText('Enable recordings')).toBeInTheDocument();
  });

  it('updates the classroom enable_chat on toggle click', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    mockedUseCurrentClassroom.mockReturnValue(classroom);
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_chat: false,
    });

    render(
      <InfoWidgetModalProvider value={null}>
        <ToolsAndApplications />
      </InfoWidgetModalProvider>,
    );

    const toggleEnableChat = screen.getByRole('checkbox', {
      name: 'Enable chat',
    });
    expect(toggleEnableChat).toBeChecked();
    await userEvent.click(toggleEnableChat);

    expect(
      await screen.findByText('Classroom updated.', {}, { timeout: 2000 }),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: expect.stringContaining(`"enable_chat":false`),
    });
  });

  it('updates the classroom enable_shared_notes on toggle click', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    mockedUseCurrentClassroom.mockReturnValue(classroom);
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_shared_notes: false,
    });
    render(
      <InfoWidgetModalProvider value={null}>
        <ToolsAndApplications />
      </InfoWidgetModalProvider>,
    );

    const toggleEnableSharedNotes = screen.getByRole('checkbox', {
      name: 'Enable shared notes',
    });
    expect(toggleEnableSharedNotes).toBeChecked();
    await userEvent.click(toggleEnableSharedNotes);

    expect(
      await screen.findByText('Classroom updated.', {}, { timeout: 2000 }),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: expect.stringContaining(`"enable_shared_notes":false`),
    });
  });

  it('updates the classroom enable_waiting_room on toggle click', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    mockedUseCurrentClassroom.mockReturnValue(classroom);
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_waiting_room: true,
    });
    render(
      <InfoWidgetModalProvider value={null}>
        <ToolsAndApplications />
      </InfoWidgetModalProvider>,
    );

    const toggleEnableWaitingRoom = screen.getByRole('checkbox', {
      name: 'Enable waiting room',
    });
    expect(toggleEnableWaitingRoom).not.toBeChecked();
    await userEvent.click(toggleEnableWaitingRoom);

    expect(
      await screen.findByText('Classroom updated.', {}, { timeout: 2000 }),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: expect.stringContaining(`"enable_waiting_room":true`),
    });
  });

  it('updates the classroom enable_recordings on toggle click', async () => {
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      recording_purpose: 'This is my record purpose',
    });
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_recordings: false,
    });

    mockedUseCurrentClassroom.mockReturnValue(classroom);

    render(
      <InfoWidgetModalProvider value={null}>
        <ToolsAndApplications />
      </InfoWidgetModalProvider>,
    );

    const toggleEnableRecordings = screen.getByRole('checkbox', {
      name: 'Enable recordings',
      checked: true,
    });
    expect(toggleEnableRecordings).toBeInTheDocument();
    expect(screen.getByLabelText('Recording purpose')).toBeInTheDocument();
    expect(screen.getByText('This is my record purpose')).toBeInTheDocument();

    mockedUseCurrentClassroom.mockReturnValue({
      ...classroom,
      enable_recordings: false,
    });

    await userEvent.click(toggleEnableRecordings);

    expect(
      await screen.findByText('Classroom updated.', {}, { timeout: 2000 }),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: expect.stringContaining(`"enable_recordings":false`),
    });

    await waitFor(() => {
      expect(
        screen.queryByRole('checkbox', {
          name: 'Enable recordings',
          checked: true,
        }),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.queryByLabelText('Recording purpose'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('This is my record purpose'),
    ).not.toBeInTheDocument();
  });

  it('updates the classroom recording purpose by typing in the textarea', async () => {
    const recording_purpose = 'This is my record purpose';
    const recording_purpose_updated = 'This is my new record purpose';
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      recording_purpose,
    });
    mockedUseCurrentClassroom.mockReturnValue(classroom);
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      recording_purpose: recording_purpose_updated,
    });

    render(
      <InfoWidgetModalProvider value={null}>
        <ToolsAndApplications />
      </InfoWidgetModalProvider>,
    );

    const textAreaRecordPurpose = screen.getByText(recording_purpose);
    expect(textAreaRecordPurpose).toBeInTheDocument();

    await userEvent.clear(textAreaRecordPurpose);
    await userEvent.type(textAreaRecordPurpose, recording_purpose_updated);

    mockedUseCurrentClassroom.mockReturnValue({
      ...classroom,
      recording_purpose: recording_purpose_updated,
    });

    expect(
      await screen.findByText('Classroom updated.', {}, { timeout: 2000 }),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: expect.stringContaining(
        `"recording_purpose":"${recording_purpose_updated}"`,
      ),
    });

    expect(screen.getByText(recording_purpose_updated)).toBeInTheDocument();
  });

  it('fails to udpate the classroom', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    mockedUseCurrentClassroom.mockReturnValue(classroom);
    fetchMock.patch('/api/classrooms/1/', 500);

    render(
      <InfoWidgetModalProvider value={null}>
        <ToolsAndApplications />
      </InfoWidgetModalProvider>,
    );

    const toggleEnableRecordings = screen.getByRole('checkbox', {
      name: 'Enable recordings',
    });
    expect(toggleEnableRecordings).toBeChecked();
    await userEvent.click(toggleEnableRecordings);

    expect(
      await screen.findByText('Classroom not updated!', {}, { timeout: 2000 }),
    ).toBeInTheDocument();

    expect(toggleEnableRecordings).toBeChecked();
  });

  it('can update multiple properties in one http call', async () => {
    const classroom = classroomMockFactory({ id: '1', started: false });
    mockedUseCurrentClassroom.mockReturnValue(classroom);
    fetchMock.patch('/api/classrooms/1/', {
      ...classroom,
      enable_waiting_room: true,
      enable_shared_notes: false,
    });
    render(
      <InfoWidgetModalProvider value={null}>
        <ToolsAndApplications />
      </InfoWidgetModalProvider>,
    );

    const toggleEnableWaitingRoom = screen.getByRole('checkbox', {
      name: 'Enable waiting room',
    });
    expect(toggleEnableWaitingRoom).not.toBeChecked();
    await userEvent.click(toggleEnableWaitingRoom);

    const toggleEnableSharedNotes = screen.getByRole('checkbox', {
      name: 'Enable shared notes',
    });
    expect(toggleEnableSharedNotes).toBeChecked();
    await userEvent.click(toggleEnableSharedNotes);

    expect(
      await screen.findByText('Classroom updated.', {}, { timeout: 2000 }),
    ).toBeInTheDocument();

    expect(fetchMock.lastCall()![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body:
        expect.stringContaining(`"enable_waiting_room":true`) &&
        expect.stringContaining(`"enable_shared_notes":false`),
    });
  });
});
