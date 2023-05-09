import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { uploadState, useCurrentResourceContext, useJwt } from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import {
  classroomMockFactory,
  classroomRecordingMockFactory,
  classroomRecordingVodMockFactory,
} from '@lib-classroom/utils/tests/factories';

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

  it('calls createVOD when convert to VOD button is clicked', () => {
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
      classroom: classroom.id,
    });

    fetchMock.mock(
      `/api/classrooms/${classroom.id}/recordings/${classroomRecording.id}/create-vod/`,
      {
        key: 'value',
      },
      {
        method: 'POST',
      },
    );

    fetchMock.mock(`/api/classrooms/${classroom.id}/`, { classroom });

    render(
      <Recording
        recording={classroomRecording}
        classroomTitle={classroom.title}
      />,
    );

    const createVodButton = screen.getByRole('button', {
      name: 'Convert Tuesday, March 1, 2022 - 11:00 AM to VOD',
    });
    expect(createVodButton).toBeInTheDocument();
    userEvent.click(createVodButton);

    expect(fetchMock.calls()).toHaveLength(2);
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
      classroom: classroom.id,
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

  it('displays vod conversion status in lti context', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      classroom: classroom.id,
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
      screen.getByText(classroomRecording.vod!.title as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(classroomRecording.vod!.upload_state as string),
    ).toBeInTheDocument();
  });

  it('displays vod lti and dashboard links in website context and when converted and vod is available', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      classroom: classroom.id,
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

    expect(screen.getByText('LTI link for this VOD:')).toBeInTheDocument();
    expect(
      screen.getByText(
        `https://localhost/lti/videos/${classroomRecording.vod!.id}`,
      ),
    ).toBeInTheDocument();
    const vodLink = screen.getByRole('link', {
      name: 'Navigate to VOD Dashboard',
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

  it('displays vod conversion status in website context', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: true,
      },
    ] as any);
    const classroom = classroomMockFactory();
    const classroomRecording = classroomRecordingMockFactory({
      classroom: classroom.id,
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
      screen.getByText(classroomRecording.vod!.title as string),
    ).toBeInTheDocument();
    expect(
      screen.getByText(classroomRecording.vod!.upload_state as string),
    ).toBeInTheDocument();
  });
});
