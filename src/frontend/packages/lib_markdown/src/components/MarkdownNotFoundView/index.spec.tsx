import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { MarkdownNotFoundView } from './index';

describe('<MarkdownNotFoundView />', () => {
  it('displays properly', () => {
    render(<MarkdownNotFoundView />);

    expect(screen.getByText('Resource not found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The resource you are looking for is not available. If you are an instructor try to re-authenticate.',
      ),
    ).toBeInTheDocument();
  });
});
