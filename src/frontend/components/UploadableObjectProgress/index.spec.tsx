import { render, screen } from '@testing-library/react';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { modelName } from '../../types/models';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { UploadManagerContext, UploadManagerStatus } from '../UploadManager';
import { UploadableObjectProgress } from '.';

jest.mock('../../data/appData', () => ({}));

describe('<UploadableObjectProgress />', () => {
  it('renders and displays the current progress', () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const objectId = uuidv4();

    const { rerender } = render(
      wrapInIntlProvider(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {
              [objectId]: {
                file,
                objectId,
                objectType: modelName.VIDEOS,
                progress: 0,
                status: UploadManagerStatus.UPLOADING,
              },
            },
          }}
        >
          <UploadableObjectProgress objectId={objectId} />
        </UploadManagerContext.Provider>,
      ),
    );
    screen.getByText('0%');

    rerender(
      wrapInIntlProvider(
        <UploadManagerContext.Provider
          value={{
            setUploadState: () => {},
            uploadManagerState: {
              [objectId]: {
                file,
                objectId,
                objectType: modelName.VIDEOS,
                progress: 51,
                status: UploadManagerStatus.UPLOADING,
              },
            },
          }}
        >
          <UploadableObjectProgress objectId={objectId} />
        </UploadManagerContext.Provider>,
      ),
    );
    screen.getByText('51%');
  });
});
