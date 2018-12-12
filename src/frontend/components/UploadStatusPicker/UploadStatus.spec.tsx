import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { Loader } from '../Loader/Loader';
import { statusIconKey, UploadStatus } from './UploadStatus';

describe('<UploadStatus />', () => {
  it('renders with children', () => {
    expect(
      shallow(<UploadStatus>Some child content</UploadStatus>).html(),
    ).toContain('Some child content');
  });

  it('displays the status icon depending on the props', () => {
    expect(
      shallow(<UploadStatus statusIcon={statusIconKey.X} />).html(),
    ).toContain('❌');

    expect(
      shallow(<UploadStatus statusIcon={statusIconKey.TICK} />).html(),
    ).toContain('✔️');

    expect(
      shallow(
        <UploadStatus statusIcon={statusIconKey.LOADER} />,
      ).containsMatchingElement(<Loader />),
    ).toBeTruthy();
  });
});
