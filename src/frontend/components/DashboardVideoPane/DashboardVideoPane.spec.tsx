import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import fetchMock from 'fetch-mock';
import * as React from 'react';

jest.mock('../DashboardVideoPaneButtons/DashboardVideoPaneButtons', () => ({
  DashboardVideoPaneButtons: () => {},
}));

import { uploadState, Video } from '../../types/tracks';
import { DashboardThumbnailConnected } from '../DashboardThumbnailConnected/DashboardThumbnailConnected';
import { DashboardVideoPaneButtons } from '../DashboardVideoPaneButtons/DashboardVideoPaneButtons';
import { DashboardVideoPaneProgressConnected } from '../DashboardVideoPaneProgressConnected/DashboardVideoPaneProgressConnected';
import { UploadStatusPicker } from '../UploadStatusPicker/UploadStatusPicker';
import { DashboardVideoPane } from './DashboardVideoPane';

const { ERROR, PENDING, PROCESSING, UPLOADING, READY } = uploadState;

const mockUpdateVideo = jest.fn();

describe('<DashboardVideoPane />', () => {
  jest.useFakeTimers();

  beforeEach(mockUpdateVideo.mockReset);

  afterEach(fetchMock.restore);

  it('renders & starts polling for the video', async () => {
    // Create a mock video with the initial state (PROCESSING)
    const mockVideo = {
      id: 'dd44',
      upload_state: PROCESSING,
      urls: { thumbnails: {} },
    } as Video;
    fetchMock.mock('/api/videos/dd44/', JSON.stringify(mockVideo));

    let wrapper = shallow(
      <DashboardVideoPane
        jwt={'cool_token_m8'}
        updateVideo={mockUpdateVideo}
        video={mockVideo}
      />,
    );

    // DashboardVideoPane shows the video as PROCESSING
    expect(wrapper.find(UploadStatusPicker).prop('state')).toEqual(PROCESSING);
    expect(fetchMock.called()).not.toBeTruthy();

    // First backend call: the video is still processing
    jest.advanceTimersByTime(1000 * 60 + 200);
    await flushAllPromises();

    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/dd44/');
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    // The video will be ready in further responses
    fetchMock.restore();
    mockVideo.upload_state = READY;
    fetchMock.mock('/api/videos/dd44/', JSON.stringify(mockVideo));

    // Second backend call
    jest.advanceTimersByTime(1000 * 60 + 200);
    await flushAllPromises();

    expect(fetchMock.lastCall()![0]).toEqual('/api/videos/dd44/');
    expect(fetchMock.lastCall()![1]!.headers).toEqual({
      Authorization: 'Bearer cool_token_m8',
    });

    expect(mockUpdateVideo).toHaveBeenCalledWith({
      id: 'dd44',
      upload_state: 'ready',
      urls: { thumbnails: {} },
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
    expect(wrapper.find(UploadStatusPicker).prop('state')).toEqual(READY);

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
            upload_state: PROCESSING,
            urls: { thumbnails: {} },
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
            upload_state: ERROR,
            urls: { thumbnails: {} },
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
            upload_state: ERROR,
            urls: { thumbnails: {} },
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

  it('shows the buttons only when the video is pending or ready', () => {
    for (const state of Object.values(uploadState)) {
      expect(
        shallow(
          <DashboardVideoPane
            jwt={'cool token m8'}
            updateVideo={mockUpdateVideo}
            video={
              {
                id: 'dd44',
                upload_state: state,
                urls: { thumbnails: {} },
              } as Video
            }
          />,
        )
          .find(DashboardVideoPaneButtons)
          .exists(),
      ).toBe([PENDING, READY].includes(state));
    }
  });

  it('shows the thumbnail only when the video is ready', () => {
    for (const state of Object.values(uploadState)) {
      expect(
        shallow(
          <DashboardVideoPane
            jwt={'cool token m8'}
            updateVideo={mockUpdateVideo}
            video={
              {
                id: 'dd44',
                upload_state: state,
                urls: { thumbnails: {} },
              } as Video
            }
          />,
        )
          .find(DashboardThumbnailConnected)
          .exists(),
      ).toBe(READY === state);
    }
  });

  it('shows the upload progress only when the video is uploading', () => {
    for (const state of Object.values(uploadState)) {
      expect(
        shallow(
          <DashboardVideoPane
            jwt={'cool token m8'}
            updateVideo={mockUpdateVideo}
            video={
              {
                id: 'ee55',
                upload_state: state,
                urls: { thumbnails: {} },
              } as Video
            }
          />,
        )
          .find(DashboardVideoPaneProgressConnected)
          .exists(),
      ).toBe(state === UPLOADING);
    }
  });
});
