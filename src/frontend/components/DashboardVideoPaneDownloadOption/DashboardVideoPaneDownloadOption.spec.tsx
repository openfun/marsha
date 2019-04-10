import { flushAllPromises } from '../../testSetup';

import { mount } from 'enzyme';
import { CheckBox } from 'grommet';
import React from 'react';
import { act } from 'react-dom/test-utils';

import { Video } from '../../types/tracks';
import { jestMockOf } from '../../utils/types';
import { DashboardVideoPaneDownloadOption } from './DashboardVideoPaneDownloadOption';

jest.mock('../../data/sideEffects/updateResource/updateResource', () => ({
  updateResource: jest.fn(),
}));

import { updateResource } from '../../data/sideEffects/updateResource/updateResource';

const mockUpdateResource: jestMockOf<
  typeof updateResource
> = updateResource as any;

describe('<DashboardVideoPaneDownloadOption />', () => {
  const video = {
    description: 'Some description',
    id: 'video-id',
    is_ready_to_play: true,
    show_download: false,
    title: 'Some title',
    upload_state: 'ready',
    urls: {
      manifests: {
        dash: 'https://example.com/dash.mpd',
        hls: 'https://example.com/hls.m3u8',
      },
      mp4: {
        144: 'https://example.com/144p.mp4',
        1080: 'https://example.com/1080p.mp4',
      },
      thumbnails: {
        720: 'https://example.com/144p.jpg',
      },
    },
  } as Video;

  it('renders with checkbox not checked', () => {
    const wrapper = mount(
      <DashboardVideoPaneDownloadOption
        video={video}
        jwt={'foo'}
        addResource={jest.fn()}
      />,
    );

    expect(wrapper.find(CheckBox).prop('checked')).toEqual(false);
  });

  it('changes the checkbox state onChange', async () => {
    const newVideo = {
      ...video,
      show_download: true,
    } as Video;
    mockUpdateResource.mockResolvedValue(newVideo);
    const mockAddResource = jest.fn();
    const wrapper = mount(
      <DashboardVideoPaneDownloadOption
        video={video}
        jwt={'foo'}
        addResource={mockAddResource}
      />,
    );

    expect(wrapper.find(CheckBox).exists()).toBe(true);
    expect(wrapper.find(CheckBox).prop('checked')).toEqual(false);
    act(() => {
      const onChange = wrapper.find(CheckBox).prop('onChange');

      if (onChange) {
        onChange({
          currentTarget: {
            checked: true,
          },
          stopPropagation: () => jest.fn(),
        });
      } else {
        throw new Error('onChange prop does not exists');
      }
    });
    await flushAllPromises();
    expect(mockAddResource).toBeCalledWith(newVideo);
    wrapper.update();
    expect(wrapper.find(CheckBox).prop('checked')).toEqual(true);
  });
});
