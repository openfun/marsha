import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { MarkdownImageProgressToast } from '.';

describe('<MarkdownImageProgressToast />', () => {
  it('displays progression', () => {
    render(
      <MarkdownImageProgressToast filename="some-file.test" progress={80} />,
    );

    expect(screen.getByText('some-file.test')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});
