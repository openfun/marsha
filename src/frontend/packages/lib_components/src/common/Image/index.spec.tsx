import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { Image } from './';

describe('<Image />', () => {
  it('renders the default component and children', () => {
    render(
      <Image
        src="http://my-image.jpg"
        alt="my-image"
        aria-label="my-label-image"
      />,
    );

    const img = screen.getByLabelText('my-label-image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass('typo-img');
    expect(img).toHaveAttribute('alt', 'my-image');
    expect(img).toHaveAttribute('src', 'http://my-image.jpg');
  });

  it('has `fit` prop', () => {
    render(<Image fit="cover" aria-label="my-label-image" />);

    expect(screen.getByLabelText('my-label-image')).toHaveStyle(
      'object-fit: cover',
    );
  });
});
