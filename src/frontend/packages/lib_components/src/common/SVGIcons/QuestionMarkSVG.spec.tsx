import React from 'react';
import { renderIconSnapshot } from 'lib-tests';

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
