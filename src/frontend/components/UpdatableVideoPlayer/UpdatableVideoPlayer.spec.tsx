import '../../testSetup';

import { mount } from 'enzyme';
import * as React from 'react';
import { Video } from 'types/Video';
import { UpdatableVideoPlayer } from './UpdatableVideoPlayer';

describe('UpdatableVideoPlayer', () => {
  it('renders the component', () => {
    const video = {
      description: 'Some description',
      id: 'video-id',
      state: 'ready',
      title: 'Some title',
      urls: {
        manifests: {
          dash: 'https://example.com/dash.mpd',
          hls: 'https://example.com/hls.m3u8',
        },
        mp4: {
          144: 'https://example.com/144p.mp4',
          1080: 'https://example.com/1080p.mp4',
        },
      },
    } as Video;

    const wrapper = mount(<UpdatableVideoPlayer video={video} />);

    expect(wrapper.find('video').length).toEqual(1);
    expect(wrapper.find('button').prop('to')).toEqual('/form');
  });
});
