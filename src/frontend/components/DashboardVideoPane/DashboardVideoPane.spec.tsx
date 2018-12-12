import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import fetchMock from 'fetch-mock';
import * as React from 'react';

jest.mock('../DashboardVideoPaneButtons/DashboardVideoPaneButtons', () => ({
  DashboardVideoPaneButtons: () => {},
}));

import { uploadState } from '../../types/tracks';
import { UploadStatusPicker } from '../UploadStatusPicker/UploadStatusPicker';
import { DashboardVideoPane } from './DashboardVideoPane';

const mockUpdateVideo = jest.fn();

describe('<DashboardVideoPane />', () => {
  jest.useFakeTimers();

  beforeEach(mockUpdateVideo.mockReset);

  afterEach(fetchMock.restore);

  it('renders & starts polling for the video', async () => {
    // Create a mock video with the initial state (PROCESSING)
    const mockVideo: any = { id: 'dd44', upload_state: uploadState.PROCESSING };
    fetchMock.mock('/api/videos/dd44/', mockVideo);

    let wrapper = shallow(
      <DashboardVideoPane
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={mockVideo}
      />,
    );

    // DashboardVideoPane shows the video as PROCESSING
    expect(wrapper.find(UploadStatusPicker).prop('state')).toEqual(
      uploadState.PROCESSING,
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
    mockVideo.upload_state = uploadState.READY;

    // Second backend call
    jest.advanceTimersByTime(1000 * 60 + 200);
    await flushAllPromises();

    expect(fetchMock.lastCall()).toEqual([
      '/api/videos/dd44/',
      { headers: { Authorization: 'Bearer cool_token_m8' } },
    ]);
    expect(mockUpdateVideo).toHaveBeenCalledWith({
      id: 'dd44',
      upload_state: 'ready',
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
    expect(wrapper.find(UploadStatusPicker).prop('state')).toEqual(
      uploadState.READY,
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
        video={
          {
            id: 'ee55',
            is_ready_to_play: false,
            upload_state: uploadState.PROCESSING,
          } as any
        }
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

  it('redirects to error when the video is in the error state and not `is_ready_to_play`', async () => {
    const wrapper = shallow(
      <DashboardVideoPane
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={
          {
            id: 'ff66',
            is_ready_to_play: false,
            upload_state: uploadState.ERROR,
          } as any
        }
      />,
    );

    expect(wrapper.name()).toEqual('Redirect');
    expect(wrapper.prop('push')).toBeTruthy();
    expect(wrapper.prop('to')).toEqual('/errors/upload');

    // Unmount DashboardVideoPane to get rid of its interval
    wrapper.unmount();
  });

  it('shows the dashboard when the video is in the error state but `is_ready_to_play`', async () => {
    const wrapper = shallow(
      <DashboardVideoPane
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={
          {
            id: 'ff66',
            is_ready_to_play: true,
            upload_state: uploadState.ERROR,
          } as any
        }
      />,
    );

    expect(wrapper.name()).not.toEqual('Redirect');
    expect(
      wrapper
        .dive()
        .childAt(0)
        .html(),
    ).toContain('Video status');

    // Unmount DashboardVideoPane to get rid of its interval
    wrapper.unmount();
  });
});
