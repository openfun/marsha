import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { Text, TextSizes, TextWeights } from './';

describe('<Text />', () => {
  it('renders the default component and children', () => {
    render(<Text>My Text</Text>);

    const typo = screen.getByText('My Text');
    expect(typo).toBeInTheDocument();
    expect(typo).toHaveClass('typo-text');
    expect(typo.tagName).toBe('SPAN');
  });

  it('has the classname from the prop', () => {
    render(<Text className="my-classname">My Text</Text>);

    expect(screen.getByText('My Text')).toHaveClass('my-classname');
  });

  Object.keys(TextSizes).forEach((_size) => {
    const size = _size as keyof typeof TextSizes;

    it(`renders Text component with size ${size}`, () => {
      render(<Text size={size}>My Text {size}</Text>);

      const typo = screen.getByText(`My Text ${size}`);
      expect(typo).toBeInTheDocument();
      expect(typo).toHaveClass(`${TextSizes[size]}`);
    });
  });

  Object.keys(TextWeights).forEach((_weight) => {
    const weight = _weight as keyof typeof TextWeights;

    it(`renders Text component with weight ${weight}`, () => {
      render(<Text weight={weight}>My Text {weight}</Text>);

      const typo = screen.getByText(`My Text ${weight}`);
      expect(typo).toBeInTheDocument();
      expect(typo).toHaveClass(`${TextWeights[weight]}`);
    });
  });

  it('has div tag', () => {
    render(<Text type="div">My Text</Text>);

    expect(screen.getByText('My Text').tagName).toBe('DIV');
  });
});
