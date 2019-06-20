import { cleanup, render } from '@testing-library/react';
import * as React from 'react';

import { appState } from '../../types/AppData';
import { uploadState } from '../../types/tracks';
import { wrapInRouter } from '../../utils/tests/router';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';
import { RedirectOnLoad } from './index';

let mockState: any;
let mockVideo: any;
jest.mock('../../data/appData', () => ({
  appData: {
    get state() {
      return mockState;
    },
    get video() {
      return mockVideo;
    },
  },
}));

describe('<RedirectOnLoad />', () => {
  beforeEach(jest.resetAllMocks);
  afterEach(cleanup);

  it('redirects to the error view on LTI error', () => {
    mockState = appState.ERROR;
    mockVideo = {};

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: ERROR_COMPONENT_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
      ]),
    );

    getByText('Error Component: lti');
  });

  it('redirects instructors to the player when the video is ready', () => {
    mockState = appState.INSTRUCTOR;

    for (const state of Object.values(uploadState)) {
      mockVideo = { is_ready_to_play: true, upload_state: state };
      const { getByText } = render(
        wrapInRouter(<RedirectOnLoad />, [
          {
            path: VIDEO_PLAYER_ROUTE(),
            render: () => <span>video player</span>,
          },
        ]),
      );

      getByText('video player');
      cleanup();
    }
  });

  it('redirects students to /player when the video is ready', () => {
    mockState = appState.STUDENT;

    for (const state of Object.values(uploadState)) {
      mockVideo = { is_ready_to_play: true, upload_state: state };
      const { getByText } = render(
        wrapInRouter(<RedirectOnLoad />, [
          {
            path: VIDEO_PLAYER_ROUTE(),
            render: () => <span>video player</span>,
          },
        ]),
      );

      getByText('video player');
      cleanup();
    }
  });

  it('redirects instructors to /form when there is no video yet', () => {
    mockState = appState.INSTRUCTOR;
    mockVideo = {
      id: '42',
      is_ready_to_play: false,
      upload_state: uploadState.PENDING,
    };

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: UPLOAD_FORM_ROUTE(),
          render: ({ match }) => (
            <span>{`objectType: ${match.params.objectType} and objectId: ${match.params.objectId}`}</span>
          ),
        },
      ]),
    );

    getByText('objectType: videos and objectId: 42');
  });

  it('redirects instructors to /dashboard when there is a video undergoing processing', () => {
    mockState = appState.INSTRUCTOR;
    mockVideo = {
      is_ready_to_play: false,
      upload_state: uploadState.PROCESSING,
    };

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: DASHBOARD_ROUTE(),
          render: () => <span>dashboard</span>,
        },
      ]),
    );

    getByText('dashboard');
  });

  it('redirects students to the error view when the video is not ready', () => {
    mockState = appState.STUDENT;
    mockVideo = {
      is_ready_to_play: false,
      upload_state: uploadState.PROCESSING,
    };

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: ERROR_COMPONENT_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
      ]),
    );

    getByText('Error Component: notFound');
  });

  it('redirects students to the error view when the video is null', () => {
    mockState = appState.STUDENT;
    mockVideo = null;

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: ERROR_COMPONENT_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
      ]),
    );

    getByText('Error Component: notFound');
  });
});
