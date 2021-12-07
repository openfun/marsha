import React from 'react';
import { renderIconSnapshot } from 'utils/tests/imageSnapshot';

import { SpeakerSVG } from './SpeakerSVG';

it('renders SpeakerSVG correctly', async () => {
  await renderIconSnapshot(<SpeakerSVG iconColor="#035ccd" />);
});
