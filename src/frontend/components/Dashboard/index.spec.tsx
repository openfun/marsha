import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';

import { Document } from '../../types/file';
import { modelName } from '../../types/models';
import { uploadState, Video } from '../../types/tracks';
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
      const mockVideo: any = {
        id: 'dd44',
        thumbnail: null,
        timed_text_tracks: [],
        upload_state: uploadState.PROCESSING,
      };

      render(
        wrapInIntlProvider(
          <Suspense fallback={<Loader />}>
            <Dashboard video={mockVideo} objectType={modelName.VIDEOS} />
          </Suspense>,
        ),
      );
      await screen.findByText('Dashboard');
      await screen.findByTitle('dd44');
    });
  });

  describe('document', () => {
    it('renders', async () => {
      const mockDocument: any = {
        id: 'doc1',
        upload_state: uploadState.PROCESSING,
      };

      const { getByText, getByTitle } = render(
        wrapInIntlProvider(
          <Suspense fallback={<Loader />}>
            <Dashboard
              document={mockDocument}
              objectType={modelName.DOCUMENTS}
            />
          </Suspense>,
        ),
      );

      await screen.findByText('Dashboard');
      await screen.findByTitle('doc1');
    });
  });
});
