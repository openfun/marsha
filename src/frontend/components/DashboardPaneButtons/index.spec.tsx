import { cleanup, render } from '@testing-library/react';
import React from 'react';

import { DashboardPaneButtons } from '.';
import { Flags } from '../../types/AppData';
import { ModelName } from '../../types/models';
import { LiveState, UploadState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = UploadState;

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

  it('only renders the "Watch" button if the video is ready', () => {
    const { getByText } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: READY })}
            objectType={ModelName.VIDEOS}
          />,
        ),
      ),
    );
    getByText('Watch');
    cleanup();

    // Can't watch the video before it's ready and uploaded
    [ERROR, PENDING, PROCESSING, UPLOADING].forEach((state) => {
      const { queryByText } = render(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={videoMockFactory({ id: 'vid1', upload_state: state })}
              objectType={ModelName.VIDEOS}
            />,
          ),
        ),
      );
      expect(queryByText('Watch')).toBeNull();
      cleanup();
    });
  });

  it('displays the configure live button', () => {
    mockFlags = { [Flags.VIDEO_LIVE]: true };
    const { getByRole } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
            objectType={ModelName.VIDEOS}
          />,
        ),
      ),
    );

    getByRole('button', { name: 'Configure a live streaming' });
  });

  it('hides the configure live button when live state is not null', () => {
    mockFlags = { [Flags.VIDEO_LIVE]: false };
    const { queryByRole } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({
              id: 'vid1',
              upload_state: PENDING,
              live_state: LiveState.IDLE,
            })}
            objectType={ModelName.VIDEOS}
          />,
        ),
      ),
    );

    expect(
      queryByRole('button', { name: 'Configure a live streaming' }),
    ).toBeNull();
  });

  it('hides the configure live button when the flag is disabled', () => {
    mockFlags = { [Flags.VIDEO_LIVE]: false };
    const { queryByRole } = render(
      wrapInIntlProvider(
        wrapInRouter(
          <DashboardPaneButtons
            object={videoMockFactory({ id: 'vid1', upload_state: PENDING })}
            objectType={ModelName.VIDEOS}
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
            objectType={ModelName.VIDEOS}
          />,
        ),
      ),
    );
    getByText('Upload a video');
    [ERROR, PROCESSING, UPLOADING, READY].forEach((state) => {
      rerender(
        wrapInIntlProvider(
          wrapInRouter(
            <DashboardPaneButtons
              object={videoMockFactory({ id: 'vid1', upload_state: state })}
              objectType={ModelName.VIDEOS}
            />,
          ),
        ),
      );
      getByText('Replace the video');
    });
  });
});
