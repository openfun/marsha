import { screen } from '@testing-library/react';
import React from 'react';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from 'components/ErrorComponents/route';
import { PLAYER_ROUTE, VIDEO_WIZARD_ROUTE } from 'components/routes';
import { useJwt } from 'data/stores/useJwt';
import { modelName } from 'types/models';
import { LiveModeType } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { RedirectVideo } from './RedirectVideo';

describe('RedirectVideo', () => {
  it('redirects to the dashboard when the video is a live and user has update permission', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: true,
          },
        } as any),
    });
    const video = videoMockFactory({
      is_ready_to_show: true,
      live_type: LiveModeType.JITSI,
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
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
          { path: VIDEO_WIZARD_ROUTE(), render: () => <span>wizard</span> },
        ],
      },
    });

    screen.getByText('dashboard');
  });

  it('redirects to the player when the video is ready to show', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });
    const liveTypes = [null, LiveModeType.JITSI];
    const video = videoMockFactory({
      is_ready_to_show: true,
      live_type: liveTypes[Math.floor(Math.random() * liveTypes.length)],
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
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
          { path: VIDEO_WIZARD_ROUTE(), render: () => <span>wizard</span> },
        ],
      },
    });

    screen.getByText('video player');
  });

  it('redirects to the wizard when the user has update permission', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: true,
          },
        } as any),
    });
    const video = videoMockFactory({
      is_ready_to_show: false,
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
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
          { path: VIDEO_WIZARD_ROUTE(), render: () => <span>wizard</span> },
        ],
      },
    });

    screen.getByText('wizard');
  });

  it('redirects to the error view when the user has no update permission and the video is not ready to show', () => {
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });
    const video = videoMockFactory({
      is_ready_to_show: false,
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
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
          { path: VIDEO_WIZARD_ROUTE(), render: () => <span>wizard</span> },
        ],
      },
    });

    screen.getByText('Error Component: notFound');
  });

  it('redirects to the player view when the starting date is set to past', () => {
    const startingAtPast = new Date();
    startingAtPast.setFullYear(startingAtPast.getFullYear() - 10);
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });
    const video = videoMockFactory({
      is_ready_to_show: false,
      starting_at: startingAtPast.toISOString(),
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
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
          { path: VIDEO_WIZARD_ROUTE(), render: () => <span>wizard</span> },
        ],
      },
    });

    screen.getByText('video player');
  });

  it('redirects to the player view when the starting date is set to future', () => {
    const startingAt = new Date();
    startingAt.setDate(startingAt.getDate() + 10);
    useJwt.setState({
      getDecodedJwt: () =>
        ({
          permissions: {
            can_update: false,
          },
        } as any),
    });
    const video = videoMockFactory({
      is_ready_to_show: false,
      starting_at: startingAt.toISOString(),
    });

    render(<RedirectVideo video={video} />, {
      routerOptions: {
        routes: [
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
          { path: VIDEO_WIZARD_ROUTE(), render: () => <span>wizard</span> },
        ],
      },
    });

    screen.getByText('video player');
  });
});
