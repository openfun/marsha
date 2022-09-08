import { screen } from '@testing-library/react';
import React from 'react';

import { useLivePanelState } from 'data/stores/useLivePanelState';
import { PictureInPictureProvider } from 'data/stores/usePictureInPicture';
import render from 'utils/tests/render';

import { SharedMediaExplorer } from '.';

describe('<SharedMediaExplorer />', () => {
  it('renders the image and additional content', () => {
    useLivePanelState.setState({
      isPanelVisible: false,
    });

    render(
      <PictureInPictureProvider value={{ reversed: false }}>
        <SharedMediaExplorer
          initialPage={1}
          pages={{ 1: 'url_1.svg', 2: 'url_2.svg' }}
        >
          <span>some additional content</span>
        </SharedMediaExplorer>
      </PictureInPictureProvider>,
    );

    screen.getByText('some additional content');

    const image = screen.getByRole('img', {
      name: 'Shared document page url_1.svg',
    });
    expect(image).toHaveAttribute('src', 'url_1.svg');
  });
});
