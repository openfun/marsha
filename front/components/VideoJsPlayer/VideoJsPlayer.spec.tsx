import '../../testSetup';

import { mount, shallow } from 'enzyme';
import * as React from 'react';
import videojs from 'video.js';

import { Video } from '../../types/Video';
import { VideoJsPlayer } from './VideoJsPlayer';

describe('VideoJsPlayer', () => {
  const video = {
    description: 'Some description',
    id: 'video-id',
    status: 'ready',
    title: 'Some title',
    urls: {
      mp4: {
        144: 'https://example.com/144p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
    },
  } as Video;

  it('renders the video element with all the relevant sources', () => {
    const wrapper = shallow(<VideoJsPlayer video={video} />);

    expect(wrapper.html()).toContain(
      '<source src="https://example.com/144p.mp4" type="video/mp4"/>',
    );
    expect(wrapper.html()).toContain(
      '<source src="https://example.com/1080p.mp4" type="video/mp4"/>',
    );
  });

  it('starts up the player when it mounts', () => {
    mount(<VideoJsPlayer video={video} />); // Mount so videojs is called with an element
    expect(videojs).toHaveBeenCalledWith(expect.any(Element), { video });
  });

  it('cleans up the player when it unmounts', () => {
    const instance = shallow(
      <VideoJsPlayer video={video} />,
    ).instance() as VideoJsPlayer;
    instance.componentWillUnmount();
    expect(instance.state.player.dispose).toHaveBeenCalled();
  });
});
