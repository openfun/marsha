import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { Document } from '../../types/file';
import { ModelName } from '../../types/models';
import { UploadState, Video } from '../../types/tracks';
import {
  documentMockFactory,
  videoMockFactory,
} from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { Loader } from '../Loader';
import Dashboard from './index';

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
}));

describe('<Dashboard />', () => {
  describe('video', () => {
    it('renders', async () => {
      const mockVideo = videoMockFactory({
        id: 'dd44',
        thumbnail: null,
        timed_text_tracks: [],
        upload_state: UploadState.PROCESSING,
      });

      render(
        wrapInIntlProvider(
          <Suspense fallback={<Loader />}>
            <Dashboard video={mockVideo} objectType={ModelName.VIDEOS} />
          </Suspense>,
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
        upload_state: UploadState.PROCESSING,
      });

      render(
        wrapInIntlProvider(
          <Suspense fallback={<Loader />}>
            <Dashboard
              document={mockDocument}
              objectType={ModelName.DOCUMENTS}
            />
          </Suspense>,
        ),
      );

      await screen.findByText('Dashboard');
      await screen.findByTitle('doc1');
    });
  });
});
