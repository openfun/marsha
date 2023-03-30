import { screen } from '@testing-library/react';
import { modelName } from 'lib-components';
import { render } from 'lib-tests';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  UploadManagerContext,
  UploadManagerStatus,
} from '@lib-components/common/UploadManager';

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
        <UploadableObjectProgress progress={0} />
      </UploadManagerContext.Provider>,
    );

    expect(screen.getByText('0%')).toBeInTheDocument();

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
        <UploadableObjectProgress progress={51} />
      </UploadManagerContext.Provider>,
    );

    expect(screen.getByText('51%')).toBeInTheDocument();
  });
});
