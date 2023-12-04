import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { uploadState, useCurrentResourceContext, useJwt } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { DateTime } from 'luxon';

import {
  classroomMockFactory,
  classroomRecordingMockFactory,
  classroomRecordingVodMockFactory,
} from '@lib-classroom/tests/factories';

import { Recording } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

const { READY, PROCESSING } = uploadState;

describe('<Recordings />', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'token',
    });
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('renders delete button when VOD not created', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      started_at: DateTime.fromJSDate(
        new Date(2022, 1, 29, 11, 0, 0),
      ).toISO() as string,
      classroom_id: classroom.id,
    });

    render(
      <Recording
        recording={classroomRecording}
        classroomTitle={classroom.title}
      />,
    );

    expect(
      await screen.findByRole('button', {
        name: 'Click on this button to delete the classroom recording.',
      }),
    ).toBeInTheDocument();
  });

  it('does not render the delete button when the record is already converted in VOD', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      classroom_id: classroom.id,
      vod: classroomRecordingVodMockFactory({
        upload_state: READY,
      }),
    });

    render(
      <Recording
        recording={classroomRecording}
        classroomTitle={classroom.title}
      />,
    );

    const deleteRecordingButton = screen.queryByRole('button', {
      name: 'Click on this button to delete the classroom recording.',
    });
    expect(deleteRecordingButton).not.toBeInTheDocument();
  });

  it('calls createVOD when convert to VOD button is clicked', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      started_at: DateTime.fromJSDate(
        new Date(2022, 1, 29, 11, 0, 0),
      ).toISO() as string,
      classroom_id: classroom.id,
    });
    const deferedCreateVod = new Deferred();

    fetchMock.mock(
      `/api/classrooms/${classroom.id}/recordings/${classroomRecording.id}/create-vod/`,
      deferedCreateVod.promise,
      {
        method: 'POST',
      },
    );

    fetchMock.mock(`/api/classrooms/${classroom.id}/`, { classroom });

    render(
      <Recording
        recording={classroomRecording}
        classroomTitle={classroom.title}
        conversionEnabled={classroom.vod_conversion_enabled}
      />,
    );

    const createVodButton = screen.getByRole('button', {
      name: 'Convert Tuesday, March 1, 2022 - 11:00 AM to VOD',
    });
    expect(createVodButton).toBeInTheDocument();
    expect(createVodButton).toBeEnabled();
    await userEvent.click(createVodButton);
    expect(createVodButton).toBeDisabled();
    deferedCreateVod.resolve({ key: 'value' });

    await waitFor(() => {
      expect(fetchMock.calls()).toHaveLength(3);
    });
    expect(fetchMock.calls()[1][0]).toBe(
      `/api/classrooms/${classroom.id}/recordings/${classroomRecording.id}/create-vod/`,
    );
    expect(fetchMock.calls()[1][1]).toMatchObject({
      body: JSON.stringify({
        title: `${classroom.title!} - Tuesday, March 1, 2022 - 11:00 AM`,
      }),
    });
  });

  it('displays vod lti link in lti context and when converted and vod is available', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      classroom_id: classroom.id,
      vod: classroomRecordingVodMockFactory({
        upload_state: READY,
      }),
    });

    render(
      <Recording
        recording={classroomRecording}
        classroomTitle="Classroom title"
      />,
    );

    expect(screen.getByText('LTI link for this VOD:')).toBeInTheDocument();
    expect(
      screen.getByText(
        `https://localhost/lti/videos/${classroomRecording.vod!.id}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: 'Navigate to VOD Dashboard',
      }),
    ).not.toBeInTheDocument();
  });

  it('displays vod conversion status in lti context', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      classroom_id: classroom.id,
      started_at: DateTime.fromJSDate(
        new Date(2022, 1, 29, 11, 0, 0),
      ).toISO() as string,
      vod: classroomRecordingVodMockFactory({
        upload_state: PROCESSING,
      }),
    });
    fetchMock.mock(`/api/classrooms/${classroom.id}/`, { classroom });

    render(
      <Recording
        recording={classroomRecording}
        classroomTitle="Classroom title"
      />,
    );

    expect(
      await screen.findByText(classroomRecording.vod!.title as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(classroomRecording.vod!.upload_state as string),
    ).toBeInTheDocument();
  });

  it('displays vod lti and dashboard links in website context and when converted and vod is available', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      classroom_id: classroom.id,
      started_at: DateTime.fromJSDate(
        new Date(2022, 1, 29, 11, 0, 0),
      ).toISO() as string,
      vod: classroomRecordingVodMockFactory({
        upload_state: READY,
      }),
    });

    render(
      <Recording
        recording={classroomRecording}
        classroomTitle="Classroom title"
      />,
    );

    expect(
      await screen.findByText('LTI link for this VOD:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `https://localhost/lti/videos/${classroomRecording.vod!.id}`,
      ),
    ).toBeInTheDocument();
    const vodLink = screen.getByRole('link', {
      name: classroomRecording.vod!.title as string,
    });
    expect(vodLink).toBeInTheDocument();
    expect(vodLink).toHaveAttribute(
      'href',
      `/my-contents/videos/${classroomRecording.vod!.id}`,
    );
    expect(
      screen.getByText(classroomRecording.vod!.title as string),
    ).toBeInTheDocument();
  });

  it('displays vod conversion status in website context', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      classroom_id: classroom.id,
      started_at: DateTime.fromJSDate(
        new Date(2022, 1, 29, 11, 0, 0),
      ).toISO() as string,
      vod: classroomRecordingVodMockFactory({
        upload_state: PROCESSING,
      }),
    });
    fetchMock.mock(`/api/classrooms/${classroom.id}/`, { classroom });

    render(
      <Recording
        recording={classroomRecording}
        classroomTitle="Classroom title"
      />,
    );

    expect(
      await screen.findByText(classroomRecording.vod!.title as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(classroomRecording.vod!.upload_state as string),
    ).toBeInTheDocument();
  });

  it('displays disabled button when conversion to VOD is disabled', async () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroom = classroomMockFactory({
      vod_conversion_enabled: false,
    });
    const classroomRecording = classroomRecordingMockFactory({
      classroom_id: classroom.id,
    });

    fetchMock.mock(`/api/classrooms/${classroom.id}/`, { classroom });

    render(
      <Recording
        recording={classroomRecording}
        conversionEnabled={classroom.vod_conversion_enabled}
      />,
    );

    expect(
      await screen.findByRole('button', {
        name: 'VOD conversion is disabled',
      }),
    ).toBeDisabled();
  });
});
