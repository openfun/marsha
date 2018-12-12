import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { uploadState } from '../../types/tracks';
import { statusIconKey, UploadStatus } from './UploadStatus';
import { UploadStatusPicker } from './UploadStatusPicker';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = uploadState;

describe('<UploadStatusPicker />', () => {
  it('renders the status list for PENDING', () => {
    const wrapper = shallow(<UploadStatusPicker state={PENDING} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Missing');
    expect(items.at(0).prop('statusIcon')).toEqual(statusIconKey.X);
  });

  it('renders the status list for UPLOADING', () => {
    const wrapper = shallow(<UploadStatusPicker state={UPLOADING} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Uploading');
    expect(items.at(0).prop('statusIcon')).toEqual(statusIconKey.LOADER);
  });

  it('renders the status list for PROCESSING', () => {
    const wrapper = shallow(<UploadStatusPicker state={PROCESSING} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Processing');
    expect(items.at(0).prop('statusIcon')).toEqual(statusIconKey.LOADER);
  });

  it('renders the status list for READY', () => {
    const wrapper = shallow(<UploadStatusPicker state={READY} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Ready');
    expect(items.at(0).prop('statusIcon')).toEqual(statusIconKey.TICK);
  });

  it('renders the status list for ERROR', () => {
    const wrapper = shallow(<UploadStatusPicker state={ERROR} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Error');
    expect(items.at(0).prop('statusIcon')).toEqual(statusIconKey.X);
  });
});
