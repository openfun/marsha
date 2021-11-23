import React from 'react';
import renderer from 'react-test-renderer';
import { SpeakerActiveSVG } from './SpeakerActiveSVG';

it('renders SpeakerActiveSVG correctly', () => {
  const SpeakerActiveSVGSnapshot = renderer
    .create(
      <SpeakerActiveSVG
        backgroundColor={'#0249a4'}
        baseColor={'white'}
        height={'54'}
        title={'View speaker'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(SpeakerActiveSVGSnapshot).toMatchSnapshot();
});
