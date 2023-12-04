import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  InfoWidgetModalProvider,
  useCurrentResourceContext,
  useJwt,
  useSiteConfig,
} from 'lib-components';
import { render } from 'lib-tests';
import { DateTime } from 'luxon';
import React from 'react';

import {
  classroomMockFactory,
  classroomRecordingMockFactory,
} from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { Recordings } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  report: jest.fn(),
  useCurrentResourceContext: jest.fn(),
}));

const mockedUseCurrentResourceContext =
  useCurrentResourceContext as jest.MockedFunction<
    typeof useCurrentResourceContext
  >;

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

  it('displays a list of available recordings', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    let classroom = classroomMockFactory({ id: '1', started: false });
    const classroomRecordings = [
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 29, 11, 0, 0),
        ).toISO() as string,
      }),
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 15, 11, 0, 0),
        ).toISO() as string,
      }),
    ];

    const { rerender } = render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Recordings />,
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    expect(screen.getByText('Recordings')).toBeInTheDocument();
    expect(screen.getByText('No recordings available')).toBeInTheDocument();

    // simulate updated classroom
    classroom = {
      ...classroom,
      recordings: classroomRecordings,
    };
    rerender(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Recordings />,
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    expect(
      screen.queryByText('No recordings available'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, March 1, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, February 15, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Convert Tuesday, March 1, 2022 - 11:00 AM to VOD',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Convert Tuesday, February 15, 2022 - 11:00 AM to VOD',
      }),
    ).toBeInTheDocument();
  });

  it('displays a list of available recordings with VOD conversion disabled in classroom', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroomRecordings = [
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 29, 11, 0, 0),
        ).toISO() as string,
      }),
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 15, 11, 0, 0),
        ).toISO() as string,
      }),
    ];
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      vod_conversion_enabled: false,
      recordings: classroomRecordings,
    });

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Recordings />,
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    expect(
      screen.getByText('Tuesday, March 1, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, February 15, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    const convertButtons = screen.getAllByRole('button', {
      name: 'VOD conversion is disabled',
    });
    expect(convertButtons).toHaveLength(2);
    for (const convertButton of convertButtons) {
      expect(convertButton).toBeDisabled();
    }
  });

  it('displays a list of available recordings with VOD conversion disabled in siteConfig', () => {
    mockedUseCurrentResourceContext.mockReturnValue([
      {
        isFromWebsite: false,
      },
    ] as any);
    const classroomRecordings = [
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 29, 11, 0, 0),
        ).toISO() as string,
      }),
      classroomRecordingMockFactory({
        started_at: DateTime.fromJSDate(
          new Date(2022, 1, 15, 11, 0, 0),
        ).toISO() as string,
      }),
    ];
    const classroom = classroomMockFactory({
      id: '1',
      started: false,
      vod_conversion_enabled: true,
      recordings: classroomRecordings,
    });
    useSiteConfig.setState({
      siteConfig: {
        is_default_site: false,
        footer_copyright: 'custom copyright',
        logo_url: 'https://example.com/logo.svg',
        is_logo_enabled: true,
        login_html: 'custom login markdown',
        vod_conversion_enabled: false,
        homepage_banner_title: 'banner title',
        homepage_banner_text: 'banner text',
      },
    });

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Recordings />,
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    expect(
      screen.getByText('Tuesday, March 1, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tuesday, February 15, 2022 - 11:00 AM'),
    ).toBeInTheDocument();
    const convertButtons = screen.getAllByRole('button', {
      name: 'VOD conversion is disabled',
    });
    expect(convertButtons).toHaveLength(2);
    for (const convertButton of convertButtons) {
      expect(convertButton).toBeDisabled();
    }
  });
});
