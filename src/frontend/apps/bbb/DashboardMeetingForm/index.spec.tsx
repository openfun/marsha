import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import MatchMediaMock from 'jest-matchmedia-mock';
import React from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { Deferred } from 'utils/tests/Deferred';

import { meetingMockFactory } from 'apps/bbb/utils/tests/factories';
import DashboardMeetingForm from './index';

let matchMedia: MatchMediaMock;

jest.mock('data/appData', () => ({
  appData: {
    modelName: 'meetings',
    resource: {
      id: '1',
    },
  },
}));

describe('<DashboardMeetingForm />', () => {
  beforeAll(() => {
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    matchMedia.clear();
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('creates a meeting with current values', async () => {
    const meeting = meetingMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/bbb_create/', deferredPatch.promise);

    const { getByText, findByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardMeetingForm meeting={meeting} />
        </QueryClientProvider>,
      ),
    );
    getByText('Title');
    getByText('Welcome text');

    fireEvent.click(screen.getByText('Create meeting in BBB'));
    await act(async () =>
      deferredPatch.resolve({ message: 'Meeting created.' }),
    );
    await findByText('Meeting created.');

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.calls()[0]![0]).toEqual('/api/meetings/1/bbb_create/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify(meeting),
    });
  });

  it('creates a meeting with updated values', async () => {
    const meeting = meetingMockFactory({ id: '1', started: false });
    const queryClient = new QueryClient();

    const deferredPatch = new Deferred();
    fetchMock.patch('/api/meetings/1/bbb_create/', deferredPatch.promise);

    const { getByText, findByText } = render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <DashboardMeetingForm meeting={meeting} />
        </QueryClientProvider>,
      ),
    );
    getByText('Title');
    getByText('Welcome text');

    const inputTitle = screen.getByRole('textbox', {
      name: /title/i,
    });
    fireEvent.change(inputTitle, { target: { value: 'updated title' } });

    const inputWelcomeText = screen.getByRole('textbox', {
      name: /welcome text/i,
    });
    fireEvent.change(inputWelcomeText, {
      target: { value: 'updated welcome text' },
    });

    fireEvent.click(screen.getByText('Create meeting in BBB'));
    await act(async () =>
      deferredPatch.resolve({ message: 'Meeting created.' }),
    );

    expect(fetchMock.calls()).toHaveLength(1);

    expect(fetchMock.calls()[0]![0]).toEqual('/api/meetings/1/bbb_create/');
    expect(fetchMock.calls()[0]![1]).toEqual({
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
      body: JSON.stringify({
        ...meeting,
        title: 'updated title',
        welcome_text: 'updated welcome text',
      }),
    });
  });
});
