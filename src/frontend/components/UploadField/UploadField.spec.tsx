import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { UploadField } from './UploadField';

describe('<UploadField />', () => {
  it('renders a Dropzone with the relevant messages', () => {
    const wrapper = shallow(<UploadField onContentUpdated={jest.fn()} />);
    expect(wrapper.childAt(0).html()).toContain('Select a file to upload');
  });

  describe('onDrop()', () => {
    it('passes the file to the callback', () => {
      const callback = jest.fn();
      const wrapper = shallow(<UploadField onContentUpdated={callback} />);
      const componentInstance = wrapper.instance() as UploadField;
      componentInstance.onDrop(['file_1']);
      expect(callback).toHaveBeenCalledWith('file_1');
    });
  });
});
