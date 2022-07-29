import { act, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';

import { useJwt } from 'data/stores/useJwt';
import { Deferred } from 'utils/tests/Deferred';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { DashboardVideoPaneStats } from '.';

describe('DashboardVideoPaneStats', () => {
  beforeEach(() => {
    useJwt.setState({
      jwt: 'cool_token_m8',
    });
  });

  it('should display the video views number', async () => {
    const video = videoMockFactory();
    const deferred = new Deferred();
    fetchMock.mock(`/api/videos/${video.id}/stats/`, deferred.promise);
    render(<DashboardVideoPaneStats video={video} />);
    screen.getByText('Loading stats...');

    await act(async () => deferred.resolve(JSON.stringify({ nb_views: 1 })));
    screen.getByText('Number of views: 1');
  });
});
