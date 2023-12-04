import { screen } from '@testing-library/react';
import { thumbnailMockFactory } from 'lib-components/tests';
import { render } from 'lib-tests';
import React from 'react';

import { ThumbnailDisplayer } from '.';

describe('<ThumbnailDisplayer />', () => {
  it('renders ThumbnailDisplayer', () => {
    const mockedThumbnail = thumbnailMockFactory();
    render(<ThumbnailDisplayer urlsThumbnail={mockedThumbnail.urls} />);

    const img = screen.getByRole('img', { name: 'Live video thumbnail' });
    expect(img.getAttribute('src')).toEqual(
      'https://example.com/default_thumbnail/144',
    );
    expect(img.getAttribute('srcset')).toEqual(
      'https://example.com/default_thumbnail/144 256w, https://example.com/default_thumbnail/240 426w, https://example.com/default_thumbnail/480 854w, https://example.com/default_thumbnail/720 1280w, https://example.com/default_thumbnail/1080 1920w',
    );
  });
});
