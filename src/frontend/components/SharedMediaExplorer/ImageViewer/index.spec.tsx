import { render, screen } from '@testing-library/react';
import React from 'react';

import { SharedMediaCurrentPageProvider } from 'data/stores/useSharedMediaCurrentPage';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { ImageViewer } from '.';

describe('<ImageViewer />', () => {
  it('renders the image', () => {
    render(
      wrapInIntlProvider(
        <SharedMediaCurrentPageProvider
          value={{ page: 0, imageUrl: 'some_url.svg' }}
        >
          <ImageViewer />
        </SharedMediaCurrentPageProvider>,
      ),
    );

    const image = screen.getByRole('img', {
      name: 'Shared document page some_url.svg',
    });
    expect(image).toHaveAttribute('src', 'some_url.svg');
  });
});
