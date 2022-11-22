/* eslint-disable jest/expect-expect */
import { renderIconSnapshot } from 'lib-tests';
import React from 'react';

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
