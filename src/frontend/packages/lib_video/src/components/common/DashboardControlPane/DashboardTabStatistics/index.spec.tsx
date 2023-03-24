import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { videoMockFactory } from 'lib-components';
import { Deferred, render } from 'lib-tests';
import React from 'react';

import { wrapInVideo } from '@lib-video/utils/wrapInVideo';

import { DashboardTabStatistics } from '.';

describe('DashboardTabStatistics', () => {
  afterEach(() => {
    fetchMock.restore();
  });
  it('displays the number of viewers', async () => {
    const video = videoMockFactory();

    const deferred = new Deferred();

    fetchMock.mock(`/api/videos/${video.id}/stats/`, deferred.promise);

    render(wrapInVideo(<DashboardTabStatistics />, video));

    // Loader
    expect(screen.getByRole('status')).toBeInTheDocument();

    deferred.resolve({
      nb_views: 3,
    });

    expect(await screen.findByText('Viewers')).toBeInTheDocument();
    expect(screen.getByText(3)).toBeInTheDocument();
  });

  it('displays one viewer', async () => {
    const video = videoMockFactory();

    const deferred = new Deferred();

    fetchMock.mock(`/api/videos/${video.id}/stats/`, deferred.promise);

    render(wrapInVideo(<DashboardTabStatistics />, video));

    // Loader
    expect(screen.getByRole('status')).toBeInTheDocument();

    deferred.resolve({
      nb_views: 1,
    });

    expect(await screen.findByText('Viewer')).toBeInTheDocument();
    expect(screen.getByText(1)).toBeInTheDocument();
  });

  it('displays no viewer', async () => {
    const video = videoMockFactory();

    const deferred = new Deferred();

    fetchMock.mock(`/api/videos/${video.id}/stats/`, deferred.promise);

    render(wrapInVideo(<DashboardTabStatistics />, video));

    // Loader
    expect(screen.getByRole('status')).toBeInTheDocument();

    deferred.resolve({
      nb_views: 0,
    });

    expect(await screen.findByText('Viewers')).toBeInTheDocument();
    expect(screen.getByText(0)).toBeInTheDocument();
  });
});
