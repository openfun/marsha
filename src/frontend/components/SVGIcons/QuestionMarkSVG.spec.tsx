import React from 'react';

import { renderIconSnapshot } from 'utils/tests/imageSnapshot';
import { QuestionMarkSVG } from './QuestionMarkSVG';

describe('<QuestionMarkSVG />', () => {
  it('renders QuestionMarkSVG correctly [screenshot]', async () => {
    await renderIconSnapshot(
      <QuestionMarkSVG
        containerStyle={{
          height: '15px',
          width: '15px',
        }}
        iconColor="blue-focus"
      />,
    );
  });
});
