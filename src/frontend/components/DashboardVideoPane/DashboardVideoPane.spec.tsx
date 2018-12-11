import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import fetchMock from 'fetch-mock';
import * as React from 'react';

jest.mock('../DashboardVideoPaneButtons/DashboardVideoPaneButtons', () => ({
  DashboardVideoPaneButtons: () => {},
}));

import { trackState } from '../../types/tracks';
import { UploadStatusList } from '../UploadStatusList/UploadStatusList';
import { DashboardVideoPane } from './DashboardVideoPane';

const mockUpdateVideo = jest.fn();

describe('<DashboardVideoPane />', () => {
  jest.useFakeTimers();

  beforeEach(mockUpdateVideo.mockReset);

  afterEach(fetchMock.restore);

  it('renders & starts polling for the video', async () => {
    // Create a mock video with the initial state (PROCESSING)
    const mockVideo: any = { id: 'dd44', state: trackState.PROCESSING };
    fetchMock.mock('/api/videos/dd44/', mockVideo);

    let wrapper = shallow(
      <DashboardVideoPane
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={mockVideo}
      />,
    );

    // DashboardVideoPane shows the video as PROCESSING
    expect(wrapper.find(UploadStatusList).prop('state')).toEqual(
      trackState.PROCESSING,
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
    mockVideo.state = trackState.READY;

    // Second backend call
    jest.advanceTimersByTime(1000 * 60 + 200);
    await flushAllPromises();

    expect(fetchMock.lastCall()).toEqual([
      '/api/videos/dd44/',
      { headers: { Authorization: 'Bearer cool_token_m8' } },
    ]);
    expect(mockUpdateVideo).toHaveBeenCalledWith({
      id: 'dd44',
      state: 'ready',
    });

    wrapper.unmount();
    wrapper = shallow(
      <DashboardVideoPane
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={mockVideo}
      />,
    );
    // DashboardVideoPane shows the video as READY
    expect(wrapper.find(UploadStatusList).prop('state')).toEqual(
      trackState.READY,
    );

    // Unmount DashboardVideoPane to get rid of its interval
    wrapper.unmount();
  });

  it('redirects to error when it fails to fetch the video', async () => {
    fetchMock.mock('/api/videos/ee55/', {
      throws: 'failed request',
    });
    const wrapper = shallow(
      <DashboardVideoPane
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={{ id: 'ee55', state: trackState.PROCESSING } as any}
      />,
    );

    jest.advanceTimersByTime(1000 * 60 + 200);
    await flushAllPromises();

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/errors/notFound');

    // Unmount DashboardVideoPane to get rid of its interval
    wrapper.unmount();
  });

  it('redirects to error when the video is in the error state', async () => {
    const wrapper = shallow(
      <DashboardVideoPane
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={{ id: 'ff66', state: trackState.ERROR } as any}
      />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/errors/upload');

    // Unmount DashboardVideoPane to get rid of its interval
    wrapper.unmount();
  });
});
