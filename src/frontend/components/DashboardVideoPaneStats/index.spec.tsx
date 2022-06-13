import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { DashboardVideoPaneStats } from '.';

jest.mock('data/appData', () => ({
  appData: {
    jwt: 'cool_token_m8',
  },
}));

describe('DashboardVideoPaneStats', () => {
  it('should display the video views number', async () => {
    const queryClient = new QueryClient();

    const video = videoMockFactory();
    const deferred = new Deferred();
    fetchMock.mock(`/api/videos/${video.id}/stats/`, deferred.promise);
    render(
      wrapInIntlProvider(
        <QueryClientProvider client={queryClient}>
          <DashboardVideoPaneStats video={video} />
        </QueryClientProvider>,
      ),
    );
    screen.getByText('Loading stats...');

    await act(async () => deferred.resolve(JSON.stringify({ nb_views: 1 })));
    screen.getByText('Number of views: 1');
  });
});
