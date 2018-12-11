import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { trackState } from '../../types/tracks';
import { statusIconKey, UploadStatus } from './UploadStatus';
import { UploadStatusList } from './UploadStatusList';

const { ERROR, PENDING, PROCESSING, READY, UPLOADING } = trackState;

describe('<UploadStatusList />', () => {
  it('renders the status list for PENDING', () => {
    const wrapper = shallow(<UploadStatusList state={PENDING} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Uploading');
    expect(items.at(0).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(0).prop('statusIcon')).not.toBeDefined();

    expect(items.at(1).html()).toContain('Processing');
    expect(items.at(1).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(1).prop('statusIcon')).not.toBeDefined();

    expect(items.at(2).html()).toContain('Ready');
    expect(items.at(2).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(2).prop('statusIcon')).not.toBeDefined();
  });

  it('renders the status list for UPLOADING', () => {
    const wrapper = shallow(<UploadStatusList state={UPLOADING} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Uploading');
    expect(items.at(0).prop('isHighlighted')).toBeTruthy();
    expect(items.at(0).prop('statusIcon')).toEqual(statusIconKey.LOADER);

    expect(items.at(1).html()).toContain('Processing');
    expect(items.at(1).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(1).prop('statusIcon')).not.toBeDefined();

    expect(items.at(2).html()).toContain('Ready');
    expect(items.at(2).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(2).prop('statusIcon')).not.toBeDefined();
  });

  it('renders the status list for PROCESSING', () => {
    const wrapper = shallow(<UploadStatusList state={PROCESSING} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Uploaded');
    expect(items.at(0).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(0).prop('statusIcon')).toEqual(statusIconKey.TICK);

    expect(items.at(1).html()).toContain('Processing');
    expect(items.at(1).prop('isHighlighted')).toBeTruthy();
    expect(items.at(1).prop('statusIcon')).toEqual(statusIconKey.LOADER);

    expect(items.at(2).html()).toContain('Ready');
    expect(items.at(2).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(2).prop('statusIcon')).not.toBeDefined();
  });

  it('renders the status list for READY', () => {
    const wrapper = shallow(<UploadStatusList state={READY} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Uploaded');
    expect(items.at(0).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(0).prop('statusIcon')).toEqual(statusIconKey.TICK);

    expect(items.at(1).html()).toContain('Processed');
    expect(items.at(1).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(1).prop('statusIcon')).toEqual(statusIconKey.TICK);

    expect(items.at(2).html()).toContain('Ready');
    expect(items.at(2).prop('isHighlighted')).toBeTruthy();
    expect(items.at(2).prop('statusIcon')).toEqual(statusIconKey.TICK);
  });

  it('renders the status list for ERROR', () => {
    const wrapper = shallow(<UploadStatusList state={ERROR} />);
    const items = wrapper.find(UploadStatus);

    expect(items.at(0).html()).toContain('Uploading');
    expect(items.at(0).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(0).prop('statusIcon')).not.toBeDefined();

    expect(items.at(1).html()).toContain('Processing');
    expect(items.at(1).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(1).prop('statusIcon')).not.toBeDefined();

    expect(items.at(2).html()).toContain('Ready');
    expect(items.at(2).prop('isHighlighted')).not.toBeTruthy();
    expect(items.at(2).prop('statusIcon')).not.toBeDefined();
  });
});
