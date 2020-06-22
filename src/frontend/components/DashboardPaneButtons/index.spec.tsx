import { cleanup, render } from '@testing-library/react';
import React from 'react';

import { DashboardPaneButtons } from '.';
import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import { videoMockFactory } from '../../utils/tests/factories';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { wrapInRouter } from '../../utils/tests/router';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

jest.mock('../../data/appData', () => ({
  appData: {
    video: {},
  },
}));

describe('<DashboardPaneButtons />', () => {
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
