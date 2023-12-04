import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { useCurrentResourceContext, useJwt } from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';

import {
  classroomMockFactory,
  classroomRecordingMockFactory,
} from '@lib-classroom/tests/factories';

import { DeleteClassroomRecordingButton } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

describe('<DeleteClassroomRecordingButton />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'json web token',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('successfully opens the confirmation modal', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      started_at: DateTime.fromJSDate(
        new Date(2022, 1, 29, 11, 0, 0),
      ).toISO() as string,
      classroom_id: classroom.id,
    });
    render(<DeleteClassroomRecordingButton recording={classroomRecording} />);

    const deleteButton = screen.getByRole('button');
    await userEvent.click(deleteButton);
    expect(
      screen.getByText(
        'Are you sure you want to delete this classroom recording ? This action is irreversible.',
      ),
    ).toBeInTheDocument();
  });

  it('successfully deletes the classroom recording', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      started_at: DateTime.fromJSDate(
        new Date(2022, 1, 29, 11, 0, 0),
      ).toISO() as string,
      classroom_id: classroom.id,
    });
    fetchMock.delete(
      `/api/classrooms/${classroom.id}/recordings/${classroomRecording.id}/`,
      204,
    );
    render(<DeleteClassroomRecordingButton recording={classroomRecording} />);

    const deleteButton = screen.getByRole('button');
    await userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete classroom recording',
    });
    await userEvent.click(confirmDeleteButton);

    const successMessage = await screen.findByText(
      'Classroom recording successfully deleted',
    );
    expect(successMessage).toBeInTheDocument();
  });

  it('fails to delete the classroom', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
        permissions: {
          can_access_dashboard: true,
          can_update: true,
        },
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      started_at: DateTime.fromJSDate(
        new Date(2022, 1, 29, 11, 0, 0),
      ).toISO() as string,
      classroom_id: classroom.id,
    });
    fetchMock.delete(
      `/api/classrooms/${classroom.id}/recordings/${classroomRecording.id}/`,
      403,
    );
    render(<DeleteClassroomRecordingButton recording={classroomRecording} />);

    const deleteButton = screen.getByRole('button');
    await userEvent.click(deleteButton);

    const confirmDeleteButton = screen.getByRole('button', {
      name: 'Confirm delete classroom recording',
    });
    await userEvent.click(confirmDeleteButton);

    const errorMessage = await screen.findByText(
      'Failed to delete the classroom recording',
    );
    expect(errorMessage).toBeInTheDocument();
  });
});
