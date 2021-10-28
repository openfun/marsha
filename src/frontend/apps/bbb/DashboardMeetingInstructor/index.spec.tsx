import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { Deferred } from 'utils/tests/Deferred';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardMeetingInstructor from '.';

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'meetings',
    resource: {
      id: '1',
    },
  },
}));

jest.mock('apps/bbb/data/bbbAppData', () => ({
  bbbAppData: {
    modelName: 'meetings',
    meeting: {
      id: '1',
    },
  },
}));

jest.mock('apps/bbb/DashboardMeetingForm', () => () => <p>meeting form</p>);

jest.mock('apps/bbb/DashboardMeetingInfos', () => () => <p>meeting infos</p>);

describe('<DashboardMeetingInstructor />', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    matchMedia.clear();
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('Displays message and triggers callbacks depending on meeting state', async () => {
    const meeting = meetingMockFactory({ id: '1', started: false });
    const joinMeetingAction = jest.fn();
    const meetingEnded = jest.fn();

    const queryClient = new QueryClient();

    const { findByText, getByText, rerender } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardMeetingInstructor
            meeting={meeting}
            joinMeetingAction={joinMeetingAction}
            meetingEnded={meetingEnded}
          />
        </QueryClientProvider>,
      ),
    );

    await findByText('meeting form');
    expect(joinMeetingAction).toHaveBeenCalledTimes(0);
    expect(meetingEnded).toHaveBeenCalledTimes(0);

    // meeting starts
    rerender(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardMeetingInstructor
            meeting={{ ...meeting, started: true }}
            joinMeetingAction={joinMeetingAction}
            meetingEnded={meetingEnded}
          />
        </QueryClientProvider>,
      ),
    );
    await findByText('meeting infos');
    expect(joinMeetingAction).toHaveBeenCalledTimes(0);
    expect(meetingEnded).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByText('Join meeting'));
    expect(joinMeetingAction).toHaveBeenCalledTimes(1);

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/bbb_end/', deferredPatch.promise);

    fireEvent.click(screen.getByText('End meeting'));
    await act(async () => deferredPatch.resolve({ message: 'meeting ended' }));
    await findByText('Ending meeting…');

    expect(fetchMock.calls()[0]![0]).toEqual('/api/meetings/1/bbb_end/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    expect(meetingEnded).toHaveBeenCalledTimes(1);
  });
});
