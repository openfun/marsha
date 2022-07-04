import { fireEvent, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router-dom';

import { DASHBOARD_ROUTE } from 'components/Dashboard/route';
import { PLAYLIST_ROUTE } from 'components/PlaylistPortability/route';
import { PLAYER_ROUTE } from 'components/routes';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { documentMockFactory, videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { LTINav } from '.';

let mockModelName: any;
let mockCanUpdate: boolean;
let mockMaintenance: boolean;
jest.mock('data/appData', () => ({
  appData: {
    get modelName() {
      return mockModelName;
    },
  },
  getDecodedJwt: () => ({
    permissions: {
      can_update: mockCanUpdate,
    },
    maintenance: mockMaintenance,
  }),
}));

describe('<LTINav />', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Video', () => {
    it('navigates between routes when video is ready', () => {
      const history = createMemoryHistory();
      const video = videoMockFactory({
        upload_state: uploadState.READY,
      });
      mockModelName = modelName.VIDEOS;
      mockCanUpdate = true;
      mockMaintenance = false;

      render(
        <Router history={history}>
          <LTINav object={video} />
        </Router>,
      );

      fireEvent.click(screen.getByRole('link', { name: /dashboard/i }));
      expect(history.location.pathname).toBe(DASHBOARD_ROUTE(modelName.VIDEOS));

      fireEvent.click(screen.getByRole('link', { name: /preview/i }));
      expect(history.location.pathname).toBe(PLAYER_ROUTE(modelName.VIDEOS));

      fireEvent.click(screen.getByRole('link', { name: /playlist/i }));
      expect(history.location.pathname).toBe(PLAYLIST_ROUTE(modelName.VIDEOS));
    });

    it('hides dashboard link when user is not permitted to update video', () => {
      const video = videoMockFactory({
        upload_state: uploadState.READY,
      });
      mockModelName = modelName.VIDEOS;
      mockCanUpdate = false;
      mockMaintenance = false;

      render(<LTINav object={video} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
      screen.getByRole('link', { name: /preview/i });
      expect(screen.queryByRole('link', { name: /playlist/i })).toBeNull();
    });

    it('hides dashboard link when system is under maintenance', () => {
      const video = videoMockFactory({
        upload_state: uploadState.READY,
      });
      mockModelName = modelName.VIDEOS;
      mockCanUpdate = true;
      mockMaintenance = true;

      render(<LTINav object={video} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
      screen.getByRole('link', { name: /preview/i });
      expect(screen.queryByRole('link', { name: /playlist/i })).toBeNull();
    });

    it('hides preview link when video is not ready', () => {
      const video = videoMockFactory({
        upload_state: uploadState.PENDING,
      });
      mockModelName = modelName.VIDEOS;
      mockCanUpdate = true;
      mockMaintenance = false;

      render(<LTINav object={video} />);

      screen.getByRole('link', { name: /dashboard/i });
      expect(screen.queryByRole('link', { name: /preview/i })).toBeNull();
      screen.getByRole('link', { name: /playlist/i });
    });
  });

  describe('Document', () => {
    it('navigates between routes when document is ready.', () => {
      const history = createMemoryHistory();
      const document = documentMockFactory({
        upload_state: uploadState.READY,
      });
      mockModelName = modelName.DOCUMENTS;
      mockCanUpdate = true;
      mockMaintenance = false;

      render(
        wrapInIntlProvider(
          <Router history={history}>
            <LTINav object={document} />
          </Router>,
        ),
      );

      fireEvent.click(screen.getByRole('link', { name: /dashboard/i }));
      expect(history.location.pathname).toBe(
        DASHBOARD_ROUTE(modelName.DOCUMENTS),
      );

      fireEvent.click(screen.getByRole('link', { name: /preview/i }));
      expect(history.location.pathname).toBe(PLAYER_ROUTE(modelName.DOCUMENTS));

      fireEvent.click(screen.getByRole('link', { name: /playlist/i }));
      expect(history.location.pathname).toBe(
        PLAYLIST_ROUTE(modelName.DOCUMENTS),
      );
    });

    it('hides dashboard link when user is not permitted to update document', () => {
      const document = documentMockFactory({
        upload_state: uploadState.READY,
      });
      mockModelName = modelName.DOCUMENTS;
      mockCanUpdate = false;
      mockMaintenance = false;

      render(<LTINav object={document} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
      screen.getByRole('link', { name: /preview/i });
      expect(screen.queryByRole('link', { name: /playlist/i })).toBeNull();
    });

    it('hides dashboard link when system is under maintenance', () => {
      const document = documentMockFactory({
        upload_state: uploadState.READY,
      });
      mockModelName = modelName.DOCUMENTS;
      mockCanUpdate = true;
      mockMaintenance = true;

      render(<LTINav object={document} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
      screen.getByRole('link', { name: /preview/i });
      expect(screen.queryByRole('link', { name: /playlist/i })).toBeNull();
    });

    it('hides preview link when document not ready.', () => {
      const document = documentMockFactory({
        upload_state: uploadState.PENDING,
      });
      mockModelName = modelName.DOCUMENTS;
      mockCanUpdate = true;
      mockMaintenance = false;

      render(<LTINav object={document} />);

      screen.getByRole('link', { name: /dashboard/i });
      expect(screen.queryByRole('link', { name: /preview/i })).toBeNull();
      screen.getByRole('link', { name: /playlist/i });
    });
  });
});
