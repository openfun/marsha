import { cleanup, screen } from '@testing-library/react';
import { documentMockFactory } from 'lib-components';
import React from 'react';

import {
  UploadManagerContext,
  UploadManagerStatus,
} from 'components/UploadManager';
import { modelName } from 'types/models';
import { uploadState } from 'types/tracks';
import render from 'utils/tests/render';

import { DashboardDocumentPaneButtons } from '.';

const { ERROR, PENDING, PROCESSING, READY } = uploadState;

jest.mock('data/stores/useAppConfig', () => ({
  useAppConfig: () => ({}),
}));

describe('<DashboardDocumentPaneButtons />', () => {
  it('only renders the "Display" button if the document is ready', async () => {
    render(
      <DashboardDocumentPaneButtons
        document={documentMockFactory({ id: 'doc1', upload_state: READY })}
      />,
    );
    screen.getByRole('button', { name: 'Display' });
    await cleanup();

    // Can't display the document before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING]) {
      render(
        <DashboardDocumentPaneButtons
          document={documentMockFactory({ id: 'doc1', upload_state: state })}
        />,
      );
      expect(screen.queryByText('Display')).toBeNull();
      await cleanup();
    }
  });

  it('adapts the text of the "Upload" button to the document state', () => {
    render(
      <DashboardDocumentPaneButtons
        document={documentMockFactory({ id: 'doc1', upload_state: PENDING })}
      />,
    );
    screen.getByText('Upload a document');
    cleanup();

    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            doc1: {
              file: new File(['(⌐□_□)'], 'document.pdf'),
              objectId: 'doc1',
              objectType: modelName.DOCUMENTS,
              progress: 0,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        <DashboardDocumentPaneButtons
          document={documentMockFactory({ id: 'doc1', upload_state: PENDING })}
        />
      </UploadManagerContext.Provider>,
    );
    screen.getByRole('button', { name: 'Replace the document' });
    cleanup();

    for (const state of [ERROR, PROCESSING, READY]) {
      render(
        <DashboardDocumentPaneButtons
          document={documentMockFactory({ id: 'doc1', upload_state: state })}
        />,
      );
      screen.getByRole('button', { name: 'Replace the document' });
      cleanup();
    }
  });
});
