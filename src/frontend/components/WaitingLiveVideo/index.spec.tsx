import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { getResource } from '../../data/sideEffects/getResource';
import { pollForLive } from 'data/sideEffects/pollForLive';
import { modelName } from 'types/models';
import { videoMockFactory } from 'utils/tests/factories';
import { wrapInIntlProvider } from 'utils/tests/intl';
import { WaitingLiveVideo } from '.';

jest.mock('data/appData', () => ({
  appData: {},
}));

jest.mock('data/sideEffects/getResource', () => ({
  getResource: jest.fn(),
}));
jest.mock('data/sideEffects/pollForLive', () => ({
  pollForLive: jest.fn(),
}));
const mockGetResource = getResource as jest.MockedFunction<typeof getResource>;
const mockPollForLive = pollForLive as jest.MockedFunction<typeof pollForLive>;

describe('WaitingLiveVideo', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the component without polling the hls manifest', () => {
    render(wrapInIntlProvider(<WaitingLiveVideo />));

    screen.getByText('Live will begin soon');
    screen.getByText(
      'The live is going to start. You can wait here, the player will start once the live is ready.',
    );

    expect(mockGetResource).not.toHaveBeenCalled();
    expect(mockPollForLive).not.toHaveBeenCalled();
  });

  it('renders the component and poll the hls manifest', async () => {
    const video = videoMockFactory({
      urls: {
        manifests: {
          hls: 'https://marsha.education/live.m3u8',
        },
        mp4: {},
        thumbnails: {},
      },
    });

    mockPollForLive.mockResolvedValue(null);
    mockGetResource.mockResolvedValue(video);

    render(wrapInIntlProvider(<WaitingLiveVideo video={video} />));

    screen.getByText('Live will begin soon');
    screen.getByText(
      'The live is going to start. You can wait here, the player will start once the live is ready.',
    );

    await waitFor(() => {
      expect(mockGetResource).toHaveBeenCalled();
    });

    expect(mockGetResource).toHaveBeenCalledWith(modelName.VIDEOS, video.id);
    expect(mockPollForLive).toHaveBeenCalledWith(video);
  });
});
