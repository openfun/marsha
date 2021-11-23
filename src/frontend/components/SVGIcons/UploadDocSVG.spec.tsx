import React from 'react';
import renderer from 'react-test-renderer';
import { UploadDocSVG } from './UploadDocSVG';

it('renders UploadDocSVG correctly', () => {
  const UploadDocSVGSnapshot = renderer
    .create(
      <UploadDocSVG
        baseColor={'blue-off'}
        height={'41.67'}
        hoverColor={'blue-active'}
        title={'Upload file'}
        width={'45.83'}
      />,
    )
    .toJSON();
  expect(UploadDocSVGSnapshot).toMatchSnapshot();
});
