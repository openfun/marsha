import { screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { SharedMediaCurrentPageProvider } from '@lib-video/hooks/useSharedMediaCurrentPage';

import { ImageViewer } from '.';

describe('<ImageViewer />', () => {
  it('renders the image', () => {
    render(
      <SharedMediaCurrentPageProvider
        value={{ page: 0, imageUrl: 'some_url.svg' }}
      >
        <ImageViewer />
      </SharedMediaCurrentPageProvider>,
    );

    const image = screen.getByRole('img', {
      name: 'Shared document page some_url.svg',
    });
    expect(image).toHaveAttribute('src', 'some_url.svg');
  });
});
