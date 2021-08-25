import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { Document } from '../../types/file';
import { uploadState, Video } from '../../types/tracks';
import {
  documentMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import Dashboard from './index';
import DashboardDocument from '../DashboardDocument';
import DashboardVideo from '../DashboardVideo';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { Loader } from '../Loader';
import { wrapInRouter } from '../../utils/tests/router';

jest.mock('../DashboardVideo', () => (props: { video: Video }) => (
  <span title={props.video.id} />
));

jest.mock('../DashboardDocument', () => (props: { document: Document }) => (
  <span title={props.document.id} />
));

jest.mock('../../data/appData', () => ({
  appData: {
    document: {
      id: 'doc1',
      upload_state: 'processing',
    },
    video: {
      id: 'dd44',
      thumbnail: null,
      timed_text_tracks: [],
      upload_state: 'processing',
    },
  },
  getDecodedJwt: () => ({
    maintenance: false,
    permissions: {
      can_update: true,
    },
  }),
}));

describe('<Dashboard />', () => {
  describe('video', () => {
    it('renders', async () => {
      const mockVideo = videoMockFactory({
        id: 'dd44',
        thumbnail: null,
        timed_text_tracks: [],
        upload_state: uploadState.PROCESSING,
      });

      render(
        wrapInIntlProvider(
          wrapInRouter(
            <Suspense fallback={<Loader />}>
              <Dashboard object={mockVideo}>
                <DashboardVideo video={mockVideo} />
              </Dashboard>
            </Suspense>,
          ),
        ),
      );
      await screen.findByText('Dashboard');
      await screen.findByTitle('dd44');
    });
  });

  describe('document', () => {
    it('renders', async () => {
      const mockDocument = documentMockFactory({
        id: 'doc1',
        upload_state: uploadState.PROCESSING,
      });

      render(
        wrapInIntlProvider(
          wrapInRouter(
            <Suspense fallback={<Loader />}>
              <Dashboard object={mockDocument}>
                <DashboardDocument document={mockDocument} />
              </Dashboard>
            </Suspense>,
          ),
        ),
      );

      await screen.findByText('Dashboard');
      await screen.findByTitle('doc1');
    });
  });
});
