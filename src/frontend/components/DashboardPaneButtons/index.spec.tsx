import { cleanup, render } from '@testing-library/react';
import { mock } from 'fetch-mock';
import React from 'react';

import { DashboardPaneButtons } from '.';
import { flags } from '../../types/AppData';
import { modelName } from '../../types/models';
import { liveState, uploadState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

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
    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: READY })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );
    getByText('Watch');
    await cleanup();

    // Can't watch the video before it's ready and uploaded
    for (const state of [ERROR, PENDING, PROCESSING, UPLOADING]) {
      const { queryByText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={videoMockFactory({ id: 'vid1', upload_state: state })}
              objectType={modelName.VIDEOS}
            />,
          ),
        ),
      );
      expect(queryByText('Watch')).toBeNull();
      await cleanup();
    }
  });

  it('displays the configure live button', () => {
    mockFlags = { [flags.VIDEO_LIVE]: true };
    const { getByRole } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );

    getByRole('button', { name: 'Configure a live streaming' });
  });

  it('hides the configure live button when live state is not null', () => {
    mockFlags = { [flags.VIDEO_LIVE]: false };
    const { queryByRole } = render(
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
      queryByRole('button', { name: 'Configure a live streaming' }),
    ).toBeNull();
  });

  it('hides the configure live button when the flag is disabled', () => {
    mockFlags = { [flags.VIDEO_LIVE]: false };
    const { queryByRole } = render(
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
      queryByRole('button', { name: 'Configure a live streaming' }),
    ).toBeNull();
  });

  it('adapts the text of the "Upload" button to the video state', () => {
    const { getByText, rerender } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
            objectType={modelName.VIDEOS}
          />,
        ),
      ),
    );
    getByText('Upload a video');

    for (const state of [ERROR, PROCESSING, UPLOADING, READY]) {
      rerender(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={videoMockFactory({ id: 'vid1', upload_state: state })}
              objectType={modelName.VIDEOS}
            />,
          ),
        ),
      );
      getByText('Replace the video');
    }
  });
});
