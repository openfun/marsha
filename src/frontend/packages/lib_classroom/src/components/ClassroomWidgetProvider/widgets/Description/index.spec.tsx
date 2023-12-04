import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { InfoWidgetModalProvider } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import { Settings } from 'luxon';

import { classroomMockFactory } from '@lib-classroom/tests/factories';
import { wrapInClassroom } from '@lib-classroom/utils/wrapInClassroom';

import { Description } from '.';

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

describe('<Description />', () => {
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
    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/create/', deferredPatch.promise);

    render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Description />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );
    expect(screen.getAllByText('Description')).toHaveLength(2);
    expect(screen.getByText('Welcome text')).toBeInTheDocument();
  });

  it('updates a classroom', async () => {
    let classroom = classroomMockFactory({ id: '1', started: false });

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/classrooms/1/', deferredPatch.promise);

    const { rerender } = render(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Description />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );

    // simulate classroom update
    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });

    // issue with useFakeTimers: https://github.com/testing-library/user-event/issues/833
    const user = userEvent.setup({ delay: null });

    await user.type(inputWelcomeText, 'updated welcome text', {
      initialSelectionStart: 0,
      initialSelectionEnd: classroom.welcome_text.length,
    });
    fireEvent.blur(inputWelcomeText);

    deferredPatch.resolve({ message: 'Classroom scheduled.' });

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(1), {
      timeout: 2000,
    });

    expect(fetchMock.calls()[0]![0]).toEqual('/api/classrooms/1/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en',
      },
      method: 'PATCH',
      body: expect.stringContaining(`"welcome_text":"updated welcome text"`),
    });

    // simulate classroom update
    classroom = {
      ...classroom,
      title: 'updated title',
      welcome_text: 'updated welcome text',
    };
    rerender(
      wrapInClassroom(
        <InfoWidgetModalProvider value={null}>
          <Description />
        </InfoWidgetModalProvider>,
        classroom,
      ),
    );
  });
});
