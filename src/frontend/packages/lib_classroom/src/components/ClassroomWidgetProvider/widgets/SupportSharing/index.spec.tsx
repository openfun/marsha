import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider } from 'lib-components';
import { render } from 'lib-tests';
import { Settings } from 'luxon';
import React from 'react';

import { classroomMockFactory } from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { SupportSharing } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({
    modelName: 'classrooms',
    resource: {
      id: '1',
    },
  }),
}));

Settings.defaultLocale = 'en';
Settings.defaultZone = 'Europe/Paris';

describe('<SupportSharing />', () => {
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

  it('renders the widget', () => {
    const classroom = classroomMockFactory({ id: '1', started: false });

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <SupportSharing />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    // We only verify that the widget is correctly loaded because
    // the behaviour is already tested in UploadDocuments.
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    expect(
      screen.getByText('Upload files to your classroom:'),
    ).toBeInTheDocument();
  });
});
