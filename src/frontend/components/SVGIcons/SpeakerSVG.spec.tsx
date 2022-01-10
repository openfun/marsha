import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { SpeakerSVG } from './SpeakerSVG';

describe('<SpeakerSVG />', () => {
  it('renders SpeakerSVG correctly', async () => {
    await renderIconSnapshot(<SpeakerSVG iconColor="#035ccd" />);
  });

  it('renders SpeakerSVG focus', async () => {
    await renderIconSnapshot(
      <SpeakerSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});
