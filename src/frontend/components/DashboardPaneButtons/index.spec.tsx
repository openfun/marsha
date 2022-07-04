import { cleanup, screen } from '@testing-library/react';
import React from 'react';

import {
  UploadManagerContext,
  UploadManagerStatus,
} from 'components/UploadManager';
import { modelName } from 'types/models';
import { liveState, uploadState } from 'types/tracks';
import { videoMockFactory } from 'utils/tests/factories';
import render from 'utils/tests/render';

import { DashboardPaneButtons } from '.';

const { ERROR, PENDING, PROCESSING, READY } = uploadState;

jest.mock('data/appData', () => ({
  appData: {},
}));

describe('<DashboardPaneButtons />', () => {
  it('only renders the "Watch" button if the video is ready', async () => {
    render(
      <DashboardPaneButtons
        object={videoMockFactory({ id: 'vid1', upload_state: READY })}
        objectType={modelName.VIDEOS}
      />,
    );
    screen.getByRole('button', { name: 'Watch' });
    await cleanup();

    // Can't watch the video before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING]) {
      render(
        <DashboardPaneButtons
          object={videoMockFactory({ id: 'vid1', upload_state: state })}
          objectType={modelName.VIDEOS}
        />,
      );
      expect(screen.queryByText('Watch')).toBeNull();
      await cleanup();
    }
  });

  it('displays the create webinar button', () => {
    render(
      <DashboardPaneButtons
        object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
        objectType={modelName.VIDEOS}
      />,
    );

    screen.getByRole('button', { name: 'Create a webinar' });
  });

  it('hides the configure live button when live state is not null', () => {
    render(
      <DashboardPaneButtons
        object={videoMockFactory({
          id: 'vid1',
          upload_state: PENDING,
          live_state: liveState.IDLE,
        })}
        objectType={modelName.VIDEOS}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Create a webinar' }),
    ).toBeNull();
  });

  it('adapts the text of the "Upload" button to the video state', () => {
    render(
      <DashboardPaneButtons
        object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
        objectType={modelName.VIDEOS}
      />,
    );
    screen.getByText('Upload a video');
    cleanup();

    render(
      <UploadManagerContext.Provider
        value={{
          setUploadState: jest.fn(),
          uploadManagerState: {
            vid1: {
              file: new File(['(⌐□_□)'], 'video.mp4'),
              objectId: 'vid1',
              objectType: modelName.VIDEOS,
              progress: 0,
              status: UploadManagerStatus.UPLOADING,
            },
          },
        }}
      >
        <DashboardPaneButtons
          object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
          objectType={modelName.VIDEOS}
        />
      </UploadManagerContext.Provider>,
    );
    screen.getByRole('button', { name: 'Replace the video' });
    cleanup();

    for (const state of [ERROR, PROCESSING, READY]) {
      render(
        <DashboardPaneButtons
          object={videoMockFactory({ id: 'vid1', upload_state: state })}
          objectType={modelName.VIDEOS}
        />,
      );
      screen.getByRole('button', { name: 'Replace the video' });
      cleanup();
    }
  });
});
