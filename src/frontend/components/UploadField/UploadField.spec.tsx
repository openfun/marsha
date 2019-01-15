import '../../testSetup';

import { mount } from 'enzyme';
import * as React from 'react';

import { UploadField } from './UploadField';

test('UploadField renders a Dropzone with the relevant messages', () => {
  const wrapper = mount(<UploadField onContentUpdated={jest.fn()} />);
  expect(wrapper.text()).toContain('Select a file to upload');
});

test('UploadField.onDrop() passes the file to the callback', () => {
  const callback = jest.fn();
  const wrapper = mount(<UploadField onContentUpdated={callback} />);
  const componentInstance = wrapper.instance() as UploadField;
  componentInstance.onDrop(['file_1']);
  expect(callback).toHaveBeenCalledWith('file_1');
});
