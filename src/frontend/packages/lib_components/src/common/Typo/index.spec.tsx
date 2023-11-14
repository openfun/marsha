import { screen, waitFor } from '@testing-library/react';
import { render } from 'lib-tests';
import { createRef } from 'react';

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

  it('has the background from the prop', () => {
    render(<Typo background="black">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('background: black');
  });

  it('has the classname background from the prop', () => {
    render(<Typo background="bg-black">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveClass('bg-black');
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

  it('has the padding from prop', () => {
    const { unmount } = render(<Typo pad="10px">My Typo</Typo>);
    expect(screen.getByText('My Typo')).toHaveStyle('padding: 10px');

    unmount();

    render(
      <Typo pad={{ horizontal: '20px', vertical: '5px', bottom: '2px' }}>
        My Typo
      </Typo>,
    );

    expect(screen.getByText('My Typo')).toHaveStyle(`
      padding-left: 20px;
      padding-right: 20px;
      padding-top: 5px;
      padding-bottom: 2px;`);
  });

  it('has the margin from prop', () => {
    const { unmount } = render(<Typo margin="10px">My Typo</Typo>);
    expect(screen.getByText('My Typo')).toHaveStyle('margin: 10px');

    unmount();

    render(
      <Typo margin={{ horizontal: '20px', vertical: '5px', bottom: '2px' }}>
        My Typo
      </Typo>,
    );

    expect(screen.getByText('My Typo')).toHaveStyle(`
      margin-left: 20px;
      margin-right: 20px;
      margin-top: 5px;
      margin-bottom: 2px;`);
  });

  it('has the width from prop', () => {
    const { unmount } = render(<Typo width="10px">My Typo</Typo>);
    expect(screen.getByText('My Typo')).toHaveStyle('width: 10px');

    unmount();

    render(
      <Typo width={{ max: '20px', min: '5px', width: '2px' }}>My Typo</Typo>,
    );

    expect(screen.getByText('My Typo')).toHaveStyle(`
      max-width: 20px;
      min-width: 5px;
      width: 2px;`);
  });

  it('has the height from prop', () => {
    const { unmount } = render(<Typo height="10px">My Typo</Typo>);
    expect(screen.getByText('My Typo')).toHaveStyle('height: 10px');

    unmount();

    render(
      <Typo height={{ max: '20px', min: '5px', height: '2px' }}>My Typo</Typo>,
    );

    expect(screen.getByText('My Typo')).toHaveStyle(`
      max-height: 20px;
      min-height: 5px;
      height: 2px;`);
  });

  it('has del tag with its specific properties', () => {
    render(
      <Typo type="del" dateTime="anything">
        My Del
      </Typo>,
    );

    expect(screen.getByText('My Del').tagName).toBe('DEL');
  });

  it('has a tag with its specific properties', () => {
    render(
      <Typo type="a" href="my-href">
        My Link
      </Typo>,
    );

    expect(screen.getByText('My Link').tagName).toBe('A');
    expect(screen.getByText('My Link')).toHaveAttribute('href', 'my-href');
  });

  it('can forward the ref', async () => {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    );
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 500,
    });

    const ref = createRef<HTMLDivElement>();
    render(<Typo ref={ref}>My Typo</Typo>);

    await waitFor(() => expect(ref.current?.offsetHeight).toBe(500));

    if (originalOffsetHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        'offsetHeight',
        originalOffsetHeight,
      );
    }
  });

  it('has the align prop', () => {
    render(<Typo align="center">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('align-items: center');
  });

  it('has the basis prop', () => {
    render(<Typo basis="50%">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('flex-basis: 50%');
  });

  it('has the display prop', () => {
    render(<Typo display="block">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('display: block');
  });

  it('has the fill prop', () => {
    render(<Typo fill>My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle(`
      height: 100%;
      width: 100%;`);
  });

  it('has the fill full prop', () => {
    render(<Typo fill="full">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle(`
      height: 100%;
      width: 100%;`);
  });

  it('has the fill horizontal prop', () => {
    render(<Typo fill="horizontal">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('width: 100%');
  });

  it('has the fill vertical prop', () => {
    render(<Typo fill="vertical">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('height: 100%');
  });

  [
    { message: '', value: true, expected: '1 1 auto' },
    { message: 'grow', value: 'grow', expected: '1 0 auto' },
    { message: 'shrink', value: 'shrink', expected: '0 1 auto' },
  ].forEach(({ message, value, expected }) => {
    it(`has the flex ${message} prop`, () => {
      render(<Typo flex={value}>My Typo</Typo>);

      expect(screen.getByText('My Typo')).toHaveStyle(`flex: ${expected}`);
    });
  });

  it('has the flow prop', () => {
    render(<Typo flow="wrap">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('flex-flow: wrap');
  });

  it('has the justify prop', () => {
    render(<Typo justify="center">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('justify-content: center');
  });

  it('has the overflow prop', () => {
    render(<Typo overflow="hidden">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('overflow: hidden');
  });

  it('has the position prop', () => {
    render(<Typo position="absolute">My Typo</Typo>);

    expect(screen.getByText('My Typo')).toHaveStyle('position: absolute');
  });
});
