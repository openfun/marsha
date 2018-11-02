import '../../testSetup';

import { mount } from 'enzyme';
import * as React from 'react';

import { VideoUploadField } from './VideoUploadField';

test('VideoUploadField renders a Dropzone with the relevant messages', () => {
  const wrapper = mount(<VideoUploadField onContentUpdated={jest.fn()} />);
  expect(wrapper.text()).toContain('Select a video to upload');
});

test('VideoUploadField.onDrop() passes the file to the callback', () => {
  const callback = jest.fn();
  const wrapper = mount(<VideoUploadField onContentUpdated={callback} />);
  const componentInstance = wrapper.instance() as VideoUploadField;
  componentInstance.onDrop(['file_1']);
  expect(callback).toHaveBeenCalledWith('file_1');
});
