import { render, screen } from '@testing-library/react';
import React from 'react';

import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInRouter } from '../../utils/tests/router';
import { modelName } from '../../types/models';
import { LiveModeType } from '../../types/tracks';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { PLAYER_ROUTE } from '../routes';
import { SUBSCRIBE_SCHEDULED_ROUTE } from '../SubscribeScheduledVideo/route';
import { RedirectVideo } from './RedirectVideo';

let mockCanUpdate: boolean;
jest.mock('../../data/appData', () => ({
  getDecodedJwt: () => ({
    permissions: {
      can_update: mockCanUpdate,
    },
  }),
}));

describe('RedirectVideo', () => {
  it('redirects to the dashboard when the video is a live and user has update permission', () => {
    mockCanUpdate = true;
    const video = videoMockFactory({
      is_ready_to_show: true,
      live_type: LiveModeType.JITSI,
    });

    render(
      wrapInRouter(<RedirectVideo video={video} />, [
        {
          path: DASHBOARD_ROUTE(modelName.VIDEOS),
          render: () => <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
        {
          path: PLAYER_ROUTE(modelName.VIDEOS),
          render: () => <span>video player</span>,
        },
        {
          path: SUBSCRIBE_SCHEDULED_ROUTE(),
          render: () => <span>subscribe</span>,
        },
      ]),
    );

    screen.getByText('dashboard');
  });

  it('redirects to the player when the video is ready to show', () => {
    const liveTypes = [null, LiveModeType.JITSI];
    mockCanUpdate = false;
    const video = videoMockFactory({
      is_ready_to_show: true,
      live_type: liveTypes[Math.floor(Math.random() * liveTypes.length)],
    });

    render(
      wrapInRouter(<RedirectVideo video={video} />, [
        {
          path: DASHBOARD_ROUTE(modelName.VIDEOS),
          render: () => <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
        {
          path: PLAYER_ROUTE(modelName.VIDEOS),
          render: () => <span>video player</span>,
        },
        {
          path: SUBSCRIBE_SCHEDULED_ROUTE(),
          render: () => <span>subscribe</span>,
        },
      ]),
    );

    screen.getByText('video player');
  });

  it('redirects to the dashboard when the user has update permission', () => {
    mockCanUpdate = true;
    const video = videoMockFactory({
      is_ready_to_show: false,
    });

    render(
      wrapInRouter(<RedirectVideo video={video} />, [
        {
          path: DASHBOARD_ROUTE(modelName.VIDEOS),
          render: () => <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
        {
          path: PLAYER_ROUTE(modelName.VIDEOS),
          render: () => <span>video player</span>,
        },
        {
          path: SUBSCRIBE_SCHEDULED_ROUTE(),
          render: () => <span>subscribe</span>,
        },
      ]),
    );

    screen.getByText('dashboard');
  });

  it('redirects to the error view when the user has no update permission and the video is not ready to show', () => {
    mockCanUpdate = false;
    const video = videoMockFactory({
      is_ready_to_show: false,
    });

    render(
      wrapInRouter(<RedirectVideo video={video} />, [
        {
          path: DASHBOARD_ROUTE(modelName.VIDEOS),
          render: () => <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
        {
          path: PLAYER_ROUTE(modelName.VIDEOS),
          render: () => <span>video player</span>,
        },
        {
          path: SUBSCRIBE_SCHEDULED_ROUTE(),
          render: () => <span>subscribe</span>,
        },
      ]),
    );

    screen.getByText('Error Component: notFound');
  });

  it('redirects to the scheduled view when the starting date is set to past', () => {
    mockCanUpdate = false;
    const video = videoMockFactory({
      is_ready_to_show: false,
      starting_at: '2000-01-01',
    });

    render(
      wrapInRouter(<RedirectVideo video={video} />, [
        {
          path: DASHBOARD_ROUTE(modelName.VIDEOS),
          render: () => <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
        {
          path: PLAYER_ROUTE(modelName.VIDEOS),
          render: () => <span>video player</span>,
        },
        {
          path: SUBSCRIBE_SCHEDULED_ROUTE(),
          render: () => <span>subscribe</span>,
        },
      ]),
    );

    screen.getByText('subscribe');
  });

  it('redirects to the scheduled view when the starting date is set to future', () => {
    const startingAt = new Date();
    startingAt.setDate(startingAt.getDate() + 10);
    mockCanUpdate = false;
    const video = videoMockFactory({
      is_ready_to_show: false,
      starting_at: `{startingAt.getFullYear()}-{startingAt.getMonth() + 1}-{startingAt.getDate() + 1}`,
    });

    render(
      wrapInRouter(<RedirectVideo video={video} />, [
        {
          path: DASHBOARD_ROUTE(modelName.VIDEOS),
          render: () => <span>dashboard</span>,
        },
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
        {
          path: PLAYER_ROUTE(modelName.VIDEOS),
          render: () => <span>video player</span>,
        },
        {
          path: SUBSCRIBE_SCHEDULED_ROUTE(),
          render: () => <span>subscribe</span>,
        },
      ]),
    );

    screen.getByText('subscribe');
  });
});
