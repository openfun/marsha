import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';

import { DashboardPaneButtons } from '.';
import { flags } from '../../types/AppData';
import { modelName } from '../../types/models';
import { liveState, uploadState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';
import { UploadManagerContext, UploadManagerStatus } from '../UploadManager';

const { ERROR, PENDING, PROCESSING, READY } = uploadState;

let mockFlags = {};
jest.mock('../../data/appData', () => ({
  appData: {
    video: {},
    get flags() {
      return mockFlags;
    },
  },
}));

describe('<DashboardPaneButtons />', () => {
  beforeEach(() => (mockFlags = {}));

  it('only renders the "Watch" button if the video is ready', async () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: READY })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );
    screen.getByRole('button', { name: 'Watch' });
    await cleanup();

    // Can't watch the video before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING]) {
      render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={videoMockFactory({ id: 'vid1', upload_state: state })}
              objectType={modelName.VIDEOS}
            />,
          ),
        ),
      );
      expect(screen.queryByText('Watch')).toBeNull();
      await cleanup();
    }
  });

  it('displays the configure live button', () => {
    mockFlags = { [flags.VIDEO_LIVE]: true };
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );

    screen.getByRole('button', { name: 'Configure a live streaming' });
  });

  it('displays the configure live and jitsi button', () => {
    mockFlags = { [flags.VIDEO_LIVE]: true, [flags.JITSI]: true };
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );

    screen.getByRole('button', { name: 'Configure a live streaming' });
    screen.getByRole('button', { name: 'Launch Jitsi LiveStream' });
  });

  it('hides the configure live button when live state is not null', () => {
    mockFlags = { [flags.VIDEO_LIVE]: false };
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({
              id: 'vid1',
              upload_state: PENDING,
              live_state: liveState.IDLE,
            })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Configure a live streaming' }),
    ).toBeNull();
  });

  it('hides the configure live button when the flag is disabled', () => {
    mockFlags = { [flags.VIDEO_LIVE]: false };
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );

    expect(
      screen.queryByRole('button', { name: 'Configure a live streaming' }),
    ).toBeNull();
  });

  it('adapts the text of the "Upload" button to the video state', () => {
    render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
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
        {wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
              objectType={modelName.VIDEOS}
            />,
          ),
        )}
      </UploadManagerContext.Provider>,
    );
    screen.getByRole('button', { name: 'Replace the video' });
    cleanup();

    for (const state of [ERROR, PROCESSING, READY]) {
      render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={videoMockFactory({ id: 'vid1', upload_state: state })}
              objectType={modelName.VIDEOS}
            />,
          ),
        ),
      );
      screen.getByRole('button', { name: 'Replace the video' });
      cleanup();
    }
  });
});
