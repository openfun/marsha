import { cleanup, render } from '@testing-library/react';
import * as React from 'react';

import { appState } from '../../types/AppData';
import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import { wrapInRouter } from '../../utils/tests/router';
import { DASHBOARD_ROUTE } from '../Dashboard/route';
import { FULL_SCREEN_ERROR_ROUTE } from '../ErrorComponents/route';
import { PLAYER_ROUTE } from '../routes';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { RedirectOnLoad } from './index';
import { SELECT_CONTENT_ROUTE } from '../SelectContent/route';

let mockState: any;
let mockVideo: any;
let mockDocument: any;
let mockLtiSelectFormData: any;
let mockModelName: any;
let mockCanUpdate: boolean;
jest.mock('../../data/appData', () => ({
  appData: {
    get isEditable() {
      return mockCanUpdate;
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
    get lti_select_form_data() {
      return mockLtiSelectFormData;
    },
    get modelName() {
      return mockModelName;
    },
  },
  getDecodedJwt: () => ({
    permissions: {
      can_update: mockCanUpdate,
    },
  }),
}));

describe('<RedirectOnLoad />', () => {
  beforeEach(jest.resetAllMocks);

  it('redirects users to the error view on LTI error', () => {
    mockState = appState.ERROR;
    mockVideo = null;
    mockDocument = null;
    mockModelName = modelName.VIDEOS;

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
      ]),
    );

    getByText('Error Component: lti');
  });

  it('redirects users to the error view when there is no resource', () => {
    mockState = appState.SUCCESS;
    mockVideo = null;
    mockDocument = null;
    mockModelName = modelName.VIDEOS;

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
      ]),
    );

    getByText('Error Component: notFound');
  });

  it('redirects users to the player when the video can be shown', async () => {
    mockState = appState.SUCCESS;
    mockModelName = modelName.VIDEOS;
    mockDocument = null;
    mockCanUpdate = false;

    for (const state of Object.values(uploadState)) {
      mockVideo = { is_ready_to_show: true, upload_state: state };
      const { getByText } = render(
        wrapInRouter(<RedirectOnLoad />, [
          {
            path: PLAYER_ROUTE(modelName.VIDEOS),
            render: () => <span>video player</span>,
          },
        ]),
      );

      getByText('video player');
      await cleanup();
    }
  });

  it('redirects users to the player when the document can be shown', async () => {
    mockState = appState.SUCCESS;
    mockModelName = modelName.DOCUMENTS;
    mockVideo = null;
    mockCanUpdate = false;

    for (const state of Object.values(uploadState)) {
      mockDocument = { is_ready_to_show: true, upload_state: state };
      const { getByText } = render(
        wrapInRouter(<RedirectOnLoad />, [
          {
            path: PLAYER_ROUTE(modelName.DOCUMENTS),
            render: () => <span>document player</span>,
          },
        ]),
      );

      getByText('document player');
      await cleanup();
    }
  });

  it('redirects users to /dashboard when video is not ready to be shown and it has permissions to update it', () => {
    mockState = appState.SUCCESS;
    mockVideo = {
      is_ready_to_show: false,
      upload_state: uploadState.PROCESSING,
    };
    mockModelName = modelName.VIDEOS;
    mockDocument = null;
    mockCanUpdate = true;

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

  it('redirects users to /dashboard when document is not ready to be shown and it has permissions to update it', () => {
    mockState = appState.SUCCESS;
    mockDocument = {
      is_ready_to_show: false,
      upload_state: uploadState.PROCESSING,
    };
    mockModelName = modelName.DOCUMENTS;
    mockVideo = null;
    mockCanUpdate = true;

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

  it('redirects users to /error when video is not ready to be shown and it has no permissions to update it', () => {
    mockState = appState.SUCCESS;
    mockVideo = {
      is_ready_to_show: false,
      upload_state: uploadState.PROCESSING,
    };
    mockModelName = modelName.VIDEOS;
    mockDocument = null;
    mockCanUpdate = false;

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
      ]),
    );

    getByText('Error Component: notFound');
  });

  it('redirects users to /error when document is not ready to be shown and it has no permissions to update it', () => {
    mockState = appState.SUCCESS;
    mockDocument = {
      is_ready_to_show: false,
      upload_state: uploadState.PROCESSING,
    };
    mockModelName = modelName.DOCUMENTS;
    mockVideo = null;
    mockCanUpdate = false;

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: FULL_SCREEN_ERROR_ROUTE(),
          render: ({ match }) => (
            <span>{`Error Component: ${match.params.code}`}</span>
          ),
        },
      ]),
    );

    getByText('Error Component: notFound');
  });

  it('redirects users to /select when LTI select data are passed', () => {
    mockLtiSelectFormData = { key: 'value' };

    const { getByText } = render(
      wrapInRouter(<RedirectOnLoad />, [
        {
          path: SELECT_CONTENT_ROUTE(),
          render: () => <span>Select LTI content</span>,
        },
      ]),
    );

    getByText('Select LTI content');
  });
});
