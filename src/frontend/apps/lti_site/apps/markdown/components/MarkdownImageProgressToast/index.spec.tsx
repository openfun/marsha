import React from 'react';

import render from 'utils/tests/render';

import MarkdownImageProgressToast from '.';

describe('<MarkdownImageProgressToast />', () => {
  it('displays progression', async () => {
    const { container } = render(
      <MarkdownImageProgressToast filename={'some-file.test'} progress={80} />,
    );

    expect(container).toMatchSnapshot();
  });
});
