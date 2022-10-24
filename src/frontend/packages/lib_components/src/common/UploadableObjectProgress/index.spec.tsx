/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { screen } from '@testing-library/react';
import { modelName } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  UploadManagerContext,
  UploadManagerStatus,
} from 'common/UploadManager';

import { UploadableObjectProgress } from '.';

jest.mock('lib-components', () => ({
  ...jest.requireActual('lib-components'),
  useAppConfig: () => ({}),
}));

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
