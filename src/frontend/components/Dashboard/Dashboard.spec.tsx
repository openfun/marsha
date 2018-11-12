import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import fetchMock from 'fetch-mock';
import * as React from 'react';

import { videoState } from '../../types/Video';
import { UploadStatus } from '../UploadStatusList/UploadStatus';
import { UploadStatusList } from '../UploadStatusList/UploadStatusList';
import { Dashboard } from './Dashboard';

describe('<Dashboard />', () => {
  jest.useFakeTimers();
  afterEach(fetchMock.restore);

  it('renders & starts polling for the video', async () => {
    // Create a mock video with the initial state (PROCESSING)
    const mockVideo: any = { id: 'dd44', state: videoState.PROCESSING };
    fetchMock.mock('/api/videos/dd44/', mockVideo);
    const mockUpdateVideo = jest.fn();

    const wrapper = shallow(
      <Dashboard
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={mockVideo}
      />,
    );

    // Dashboard shows the video as PROCESSING
    expect(wrapper.html()).toContain('Dashboard');
    expect(wrapper.find(UploadStatusList).prop('state')).toEqual(
      videoState.PROCESSING,
    );
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the video is still processing
    jest.advanceTimersByTime(1000 * 60 + 200);
    await flushAllPromises();
    expect(fetchMock.lastCall()).toEqual([
      '/api/videos/dd44/',
      { headers: { Authorization: 'Bearer cool_token_m8' } },
    ]);

    // The video will be ready in further responses
    fetchMock.reset();
    mockVideo.state = videoState.READY;

    // Second backend call
    jest.advanceTimersByTime(1000 * 60 + 200);
    await flushAllPromises();
    expect(fetchMock.lastCall()).toEqual([
      '/api/videos/dd44/',
      { headers: { Authorization: 'Bearer cool_token_m8' } },
    ]);

    // Dashboard shows the video as READY
    expect(wrapper.find(UploadStatusList).prop('state')).toEqual(
      videoState.READY,
    );
    expect(mockUpdateVideo).toHaveBeenCalledWith({
      id: 'dd44',
      state: 'ready',
    });

    // Unmount Dashboard to get rid of its interval
    wrapper.unmount();
  });

  it('redirects to error when it fails to fetch the video', async () => {
    fetchMock.mock('/api/videos/ee55/', {
      throws: 'failed request',
    });
    const wrapper = shallow(
      <Dashboard
        jwt={'cool_token_m8'}
        video={{ id: 'ee55', state: videoState.PROCESSING } as any}
      />,
    );

    jest.advanceTimersByTime(1000 * 60 + 200);
    await flushAllPromises();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/errors/notFound');

    // Unmount Dashboard to get rid of its interval
    wrapper.unmount();
  });
});
