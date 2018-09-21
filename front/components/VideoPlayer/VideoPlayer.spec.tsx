import '../../testSetup';

import { mount, shallow } from 'enzyme';
import Plyr from 'plyr';
import * as React from 'react';

import { Video } from '../../types/Video';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
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
    const wrapper = shallow(<VideoPlayer video={video} />);

    expect(wrapper.html()).toContain(
      '<source size="144" src="https://example.com/144p.mp4" type="video/mp4"/>',
    );
    expect(wrapper.html()).toContain(
      '<source size="1080" src="https://example.com/1080p.mp4" type="video/mp4"/>',
    );
  });

  it('starts up the player when it mounts', () => {
    mount(<VideoPlayer video={video} />); // Mount so videojs is called with an element
    expect(Plyr).toHaveBeenCalledWith(expect.any(Element));
  });

  it('cleans up the player when it unmounts', () => {
    const instance = shallow(
      <VideoPlayer video={video} />,
    ).instance() as VideoPlayer;
    instance.componentWillUnmount();
    expect(instance.state.player!.destroy).toHaveBeenCalled();
  });
});
