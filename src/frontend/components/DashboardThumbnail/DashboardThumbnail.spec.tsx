import { flushAllPromises } from '../../testSetup';

import { shallow } from 'enzyme';
import { Button, Text } from 'grommet';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Redirect } from 'react-router-dom';

jest.mock('../../data/sideEffects/createThumbnail/createThumbnail', () => ({
  createThumbnail: jest.fn(),
}));

import { createThumbnail } from '../../data/sideEffects/createThumbnail/createThumbnail';
import { modelName } from '../../types/models';
import { uploadState } from '../../types/tracks';
import { jestMockOf } from '../../utils/types';
import { DashboardThumbnailDisplay } from '../DashboardThumbnailDisplay/DashboardThumbnailDisplay';
import { DashboardThumbnailProgressConnected } from '../DashboardThumbnailProgressConnected/DashboardThumbnailProgressConnected';
import { UPLOAD_FORM_ROUTE } from '../UploadForm/route';
import { DashboardThumbnail } from './DashboardThumbnail';

const mockCreateThumbnail: jestMockOf<
  typeof createThumbnail
> = createThumbnail as any;

describe('<DashboardThumbnail />', () => {
  afterEach(jest.resetAllMocks);

  it('display a thumbnail when Thumbnail resource is ready', () => {
    const thumbnail = {
      id: 42,
      is_ready_to_display: true,
      upload_state: uploadState.READY,
    } as any;

    const video = {
      id: 43,
    } as any;

    const wrapper = shallow(
      <DashboardThumbnail
        video={video}
        thumbnail={thumbnail}
        jwt={'token'}
        addThumbnail={jest.fn}
      />,
    );

    expect(wrapper.find(DashboardThumbnailDisplay).exists()).toEqual(true);
    expect(wrapper.find(Text).exists()).toEqual(false);
  });

  it('display a thumbnail when there is no Thumbnail resource using the video resource', () => {
    const thumbnail = null;

    const video = {
      id: 43,
    } as any;

    const wrapper = shallow(
      <DashboardThumbnail
        video={video}
        thumbnail={thumbnail}
        jwt={'token'}
        addThumbnail={jest.fn}
      />,
    );

    expect(wrapper.find(DashboardThumbnailDisplay).exists()).toEqual(true);
    expect(wrapper.find(Text).exists()).toEqual(false);
  });

  it('display a progress bar when the status is uploading', () => {
    const thumbnail = {
      id: 42,
      is_ready_to_display: false,
      upload_state: uploadState.UPLOADING,
    } as any;

    const video = {
      id: 43,
    } as any;

    const wrapper = shallow(
      <DashboardThumbnail
        video={video}
        thumbnail={thumbnail}
        jwt={'token'}
        addThumbnail={jest.fn}
      />,
    );

    expect(wrapper.find(DashboardThumbnailProgressConnected).exists()).toEqual(
      true,
    );
  });

  it('display a waiting message when a thumbnail is processing', () => {
    const thumbnail = {
      id: 42,
      is_ready_to_display: false,
      upload_state: uploadState.PROCESSING,
    } as any;

    const video = {
      id: 43,
    } as any;

    const wrapper = shallow(
      <DashboardThumbnail
        video={video}
        thumbnail={thumbnail}
        jwt={'token'}
        addThumbnail={jest.fn}
      />,
    );

    const text = wrapper.find(Text);

    expect(text.exists()).toEqual(true);
    expect(text.render().text()).toEqual(
      'Your thumbnail is currently processing. This may take several minutes. It will appear here once done.',
    );
  });

  it('display an error message when a thumbnail is in error state', () => {
    const thumbnail = {
      id: 42,
      is_ready_to_display: false,
      upload_state: uploadState.ERROR,
    } as any;

    const video = {
      id: 43,
    } as any;

    const wrapper = shallow(
      <DashboardThumbnail
        video={video}
        thumbnail={thumbnail}
        jwt={'token'}
        addThumbnail={jest.fn}
      />,
    );

    const text = wrapper.find(Text);

    expect(text.exists()).toEqual(true);
    expect(text.render().text()).toEqual(
      'There was an error during thumbnail creation.',
    );
    expect(text.prop('color')).toEqual('status-error');
  });

  it('creates a new thumbnail when none exists and one want to upload a new one', async () => {
    const thumbnail = null;

    const video = {
      id: 43,
    } as any;

    const mockAddThumbnail = jest.fn();

    const wrapper = shallow(
      <DashboardThumbnail
        video={video}
        thumbnail={thumbnail}
        jwt={'token'}
        addThumbnail={mockAddThumbnail}
      />,
    );

    expect(wrapper.find(DashboardThumbnailDisplay).exists()).toEqual(true);

    mockCreateThumbnail.mockResolvedValue({
      id: 42,
    } as any);

    wrapper.find(Button).simulate('click');
    await flushAllPromises();
    expect(mockCreateThumbnail).toHaveBeenCalledWith('token');
    expect(mockAddThumbnail).toHaveBeenCalledWith({ id: 42 });
  });
});
