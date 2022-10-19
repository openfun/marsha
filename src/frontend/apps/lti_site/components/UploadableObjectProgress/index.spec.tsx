import { screen } from '@testing-library/react';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import { UploadManagerContext, UploadManagerStatus } from 'lib-components';
import { modelName } from 'lib-components';
import render from 'utils/tests/render';

import { UploadableObjectProgress } from '.';

jest.mock('data/stores/useAppConfig', () => ({ useAppConfig: () => ({}) }));

describe('<UploadableObjectProgress />', () => {
  it('renders and displays the current progress', () => {
    const file = new File(['(⌐□_□)'], 'course.mp4', { type: 'video/mp4' });
    const objectId = uuidv4();

    const { rerender } = render(
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
    );
    screen.getByText('0%');

    rerender(
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
    );
    screen.getByText('51%');
  });
});
