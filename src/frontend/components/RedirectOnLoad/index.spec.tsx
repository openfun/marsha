import { cleanup, render } from '@testing-library/react';
import * as React from 'react';

import { appState } from '../../types/AppData';
import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import { wrapInRouter } from '../../utils/tests/router';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { DOCUMENT_PLAYER_ROUTE } from '../DocumentPlayer/route';
import { ERROR_COMPONENT_ROUTE } from '../ErrorComponent/route';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { VIDEO_PLAYER_ROUTE } from '../VideoPlayer/route';
import { RedirectOnLoad } from './index';

let mockState: any;
let mockVideo: any;
let mockDocument: any;
let mockModelName: any;
let mockIsEditable: boolean;
jest.mock('../../data/appData', () => ({
  appData: {
    get isEditable() {
      return mockIsEditable;
    },
    get state() {
      return mockState;
    },
    get video() {
      return mockVideo;
    },
    get document() {
      return mockDocument;
    },
    get modelName() {
      return mockModelName;
    },
  },
}));

describe('<RedirectOnLoad />', () => {
  beforeEach(jest.resetAllMocks);

  it('redirects to the error view on LTI error', () => {
    mockState = appState.ERROR;
    mockVideo = null;
    mockDocument = null;
    mockModelName = modelName.VIDEOS;

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
    mockState = appState.SUCCESS;
    mockModelName = modelName.VIDEOS;
    mockDocument = null;
    mockIsEditable = true;

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

  it('redirects instructors to the player when the document is ready', () => {
    mockState = appState.SUCCESS;
    mockModelName = modelName.DOCUMENTS;
    mockVideo = null;
    mockIsEditable = true;

    for (const state of Object.values(uploadState)) {
      mockDocument = { is_ready_to_display: true, upload_state: state };
      const { getByText } = render(
        wrapInRouter(<RedirectOnLoad />, [
          {
            path: DOCUMENT_PLAYER_ROUTE(),
            render: () => <span>document player</span>,
          },
        ]),
      );

      getByText('document player');
      cleanup();
    }
  });

  it('redirects students to /player when the video is ready', () => {
    mockState = appState.SUCCESS;
    mockModelName = modelName.VIDEOS;
    mockDocument = null;
    mockIsEditable = false;

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

  it('redirects students to /player when the document is ready', () => {
    mockState = appState.SUCCESS;
    mockModelName = modelName.DOCUMENTS;
    mockVideo = null;
    mockIsEditable = false;

    for (const state of Object.values(uploadState)) {
      mockDocument = { is_ready_to_display: true, upload_state: state };
      const { getByText } = render(
        wrapInRouter(<RedirectOnLoad />, [
          {
            path: DOCUMENT_PLAYER_ROUTE(),
            render: () => <span>document player</span>,
          },
        ]),
      );

      getByText('document player');
      cleanup();
    }
  });

  it('redirects instructors to /form when there is no video yet', () => {
    mockState = appState.SUCCESS;
    mockVideo = {
      id: '42',
      is_ready_to_play: false,
      upload_state: uploadState.PENDING,
    };
    mockModelName = modelName.VIDEOS;
    mockDocument = null;
    mockIsEditable = true;

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

  it('redirects instructors to /form when there is no document yet', () => {
    mockState = appState.SUCCESS;
    mockVideo = null;
    mockModelName = modelName.DOCUMENTS;
    mockDocument = {
      id: '42',
      is_ready_to_display: false,
      upload_state: uploadState.PENDING,
    };
    mockIsEditable = true;

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

    getByText('objectType: documents and objectId: 42');
  });

  it('redirects instructors to /dashboard when there is a video undergoing processing', () => {
    mockState = appState.SUCCESS;
    mockVideo = {
      is_ready_to_play: false,
      upload_state: uploadState.PROCESSING,
    };
    mockModelName = modelName.VIDEOS;
    mockDocument = null;
    mockIsEditable = true;

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: DASHBOARD_ROUTE(),
          render: ({ match }) => (
            <span>{`dashboard ${match.params.objectType}`}</span>
          ),
        },
      ]),
    );

    getByText('dashboard videos');
  });

  it('redirects instructors to /dashboard when there is a document undergoing processing', () => {
    mockState = appState.SUCCESS;
    mockVideo = null;
    mockModelName = modelName.DOCUMENTS;
    mockDocument = {
      is_ready_to_display: false,
      upload_state: uploadState.PROCESSING,
    };
    mockIsEditable = true;

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: DASHBOARD_ROUTE(),
          render: ({ match }) => (
            <span>{`dashboard ${match.params.objectType}`}</span>
          ),
        },
      ]),
    );

    getByText('dashboard documents');
  });

  it('redirects students to the error view when the video is not ready', () => {
    mockState = appState.SUCCESS;
    mockVideo = {
      is_ready_to_play: false,
      upload_state: uploadState.PROCESSING,
    };
    mockModelName = modelName.VIDEOS;
    mockDocument = null;
    mockIsEditable = false;

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

  it('redirects students to the error view when the document is not ready', () => {
    mockState = appState.SUCCESS;
    mockDocument = {
      is_ready_to_display: false,
      upload_state: uploadState.PROCESSING,
    };
    mockModelName = modelName.DOCUMENTS;
    mockVideo = null;
    mockIsEditable = false;

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

  it('redirects students to the error view when the resource is null', () => {
    mockState = appState.SUCCESS;
    mockVideo = null;
    mockDocument = null;
    mockIsEditable = false;

    for (const model of [modelName.VIDEOS, modelName.DOCUMENTS]) {
      mockModelName = model;
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
      cleanup();
    }
  });
});
