import React from 'react';
import renderer from 'react-test-renderer';
import { SpeakerSVG } from './SpeakerSVG';

it('renders SpeakerSVG correctly', () => {
  const SpeakerSVGSnapshot = renderer
    .create(<SpeakerSVG iconColor={'#035ccd'} />)
    .toJSON();
  expect(SpeakerSVGSnapshot).toMatchSnapshot();
});
