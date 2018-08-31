import '../../testSetup';

import { mount } from 'enzyme';
import * as React from 'react';
import { IntlProvider } from 'react-intl';

import { VideoUploadField } from './VideoUploadField';

test('VideoUploadField renders a Dropzone with the relevant messages', () => {
  const wrapper = mount(<VideoUploadField onContentUpdated={jest.fn()} />);

  expect(wrapper.html()).toContain('dropzone');
  expect(wrapper.text()).toContain('Pick a video to upload');
  expect(wrapper.text()).not.toContain('Clear selected file');
});

test('VideoUploadField.onDrop() passes the file to the callback and updates the UI', () => {
  const callback = jest.fn();
  const wrapper = mount(<VideoUploadField onContentUpdated={callback} />);
  const componentInstance = wrapper.instance() as VideoUploadField;
  componentInstance.onDrop(['file_1']);

  expect(callback).toHaveBeenCalledWith('file_1');
  expect(wrapper.text()).not.toContain('Pick a video to upload');
  expect(wrapper.text()).toContain('Clear selected file');
  expect(wrapper.html()).toContain('aria-disabled="true"');
});

test('VideoUploadField.clearFile() calls the callback with undefined and resets the UI', () => {
  const callback = jest.fn();
  const wrapper = mount(<VideoUploadField onContentUpdated={callback} />);
  const componentInstance = wrapper.instance() as VideoUploadField;
  componentInstance.onDrop(['file_1']);
  callback.mockReset();
  componentInstance.clearFile();

  expect(callback).toHaveBeenCalledWith(undefined);
  expect(wrapper.text()).toContain('Pick a video to upload');
  expect(wrapper.text()).not.toContain('Clear selected file');
  expect(wrapper.html()).toContain('aria-disabled="false"');
});
