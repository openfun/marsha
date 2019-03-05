import '../../testSetup';

import { mount } from 'enzyme';
import * as React from 'react';

import { Video } from '../../types/tracks';
import { DownloadVideo } from './DownloadVideo';

describe('<DownloadVideo />', () => {
  const video = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_play: true,
    title: 'Some title',
    upload_state: 'ready',
    urls: {
      manifests: {
        dash: 'https://example.com/dash.mpd',
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {
        480: 'https://example.com/480p.mp4',
        720: 'https://example.com/720p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
      thumbnails: {
        720: 'https://example.com/144p.jpg',
      },
    },
  } as Video;
  it('renders all video links', () => {
    const wrapper = mount(<DownloadVideo video={video} />);

    const links = wrapper.find('a');
    expect(links.length).toEqual(3);
    expect(links.at(0).text()).toEqual('1080p');
    expect(links.at(1).text()).toEqual('720p');
    expect(links.at(2).text()).toEqual('480p');
  });
});
