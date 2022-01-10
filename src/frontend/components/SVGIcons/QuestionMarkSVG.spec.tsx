import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { QuestionMarkSVG } from './QuestionMarkSVG';

describe('<QuestionMarkSVG />', () => {
  it('renders QuestionMarkSVG correctly', async () => {
    await renderIconSnapshot(
      <QuestionMarkSVG height={15} width={15} iconColor="#031963" />,
    );
  });
});
