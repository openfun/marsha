import { render } from 'lib-tests';
import React from 'react';

import { MarkdownImageProgressToast } from '.';

describe('<MarkdownImageProgressToast />', () => {
  it('displays progression', () => {
    const { container } = render(
      <MarkdownImageProgressToast filename="some-file.test" progress={80} />,
    );

    expect(container).toMatchSnapshot();
  });
});
