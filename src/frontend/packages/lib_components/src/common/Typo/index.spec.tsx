import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { Typo } from './';

describe('<Typo />', () => {
  it('renders the default component and children', () => {
    render(<Typo>My Typo</Typo>);

    const typo = screen.getByText('My Typo');
    expect(typo).toBeInTheDocument();
    expect(typo).toHaveClass('typo');
    expect(typo.tagName).toBe('DIV');
  });

  it('has the classname from the prop', () => {
    render(<Typo className="my-classname">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveClass('my-classname');
  });

  it('has the color from the prop', () => {
    render(<Typo color="black">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('color: black');
  });

  it('has the classname color from the prop', () => {
    render(<Typo color="clr-black">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveClass('clr-black');
  });

  it('has the font size from the prop', () => {
    render(<Typo fontSize="1rem">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('font-size: 1rem');
  });

  it('has the text align from the prop', () => {
    render(<Typo textAlign="center">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('text-align: center');
  });

  it('has the truncate style', () => {
    render(<Typo truncate>My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('text-overflow: ellipsis');
  });

  it('has canvas tag', () => {
    render(
      <Typo type="canvas" height={10}>
        My Canvas
      </Typo>,
    );

    expect(screen.getByText('My Canvas').tagName).toBe('CANVAS');
  });

  it('has link tag', () => {
    render(
      <Typo type="a" href="my-href">
        My Link
      </Typo>,
    );

    expect(screen.getByText('My Link').tagName).toBe('A');
    expect(screen.getByText('My Link')).toHaveAttribute('href', 'my-href');
  });
});
