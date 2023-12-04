import { cleanup, screen } from '@testing-library/react';
import {
  UploadManagerContext,
  UploadManagerStatus,
  modelName,
  uploadState,
} from 'lib-components';
import { documentMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { DashboardDocumentPaneButtons } from '.';

const { ERROR, PENDING, PROCESSING, READY } = uploadState;

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

describe('<DashboardDocumentPaneButtons />', () => {
  it('only renders the "Display" button if the document is ready', () => {
    render(
      <DashboardDocumentPaneButtons
        document={documentMockFactory({ id: 'doc1', upload_state: READY })}
      />,
    );
    screen.getByRole('button', { name: 'Display' });
    cleanup();

    // Can't display the document before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING]) {
      render(
        <DashboardDocumentPaneButtons
          document={documentMockFactory({ id: 'doc1', upload_state: state })}
        />,
      );
      expect(screen.queryByText('Display')).toBeNull();
      cleanup();
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
    expect(
      screen.getByRole('button', { name: 'Replace the document' }),
    ).toBeInTheDocument();
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
