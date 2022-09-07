import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

import { SpeakerSVG } from './SpeakerSVG';

describe('<SpeakerSVG />', () => {
  it('renders SpeakerSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(<SpeakerSVG iconColor="#035ccd" />);
  });

  it('renders SpeakerSVG focus [screenshot]', async () => {
    await renderIconSnapshot(
      <SpeakerSVG iconColor="white" focusColor="#035ccd" />,
    );
  });
});
