import React from 'react';
import renderer from 'react-test-renderer';
import { SpeakerInactiveSVG } from './SpeakerInactiveSVG';

it('renders SpeakerInactiveSVG correctly', () => {
  const SpeakerInactiveSVGSnapshot = renderer
    .create(
      <SpeakerInactiveSVG
        backgroundColor={'none'}
        baseColor={'#035ccd'}
        height={'54'}
        title={'View speaker'}
        width={'54'}
      />,
    )
    .toJSON();
  expect(SpeakerInactiveSVGSnapshot).toMatchSnapshot();
});
