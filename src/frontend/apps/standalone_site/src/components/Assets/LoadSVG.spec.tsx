import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { ReactComponent as StarIcon } from 'assets/svg/iko_starsvg.svg';

import LoadSVG from './LoadSVG';

const messages = {
  testLabel: {
    defaultMessage: 'My test',
    description: 'My test description',
    id: 'my.id.testLabel',
  },
};

describe('<LoadSVG />', () => {
  test('renders LoadSVG', () => {
    render(
      <LoadSVG
        Icon={StarIcon}
        aria-label="svg-menu-favorites"
        title={messages.testLabel}
      />,
    );

    const mySvg = screen.getByRole(/img/i, { name: /svg-menu-favorites/i });

    expect(mySvg).toBeInTheDocument();
    expect(mySvg).toHaveAttribute('width', '30');
    expect(mySvg).toHaveAttribute('height', '30');
    expect(mySvg).toHaveAttribute('title', 'My test');
    expect(screen.getByText(/iko_starsvg.svg/i)).toBeInTheDocument();
  });

  test('renders LoadSVG with width height props', () => {
    render(
      <LoadSVG
        Icon={StarIcon}
        aria-label="svg-menu-favorites"
        title={messages.testLabel}
        width={40}
        height={40}
      />,
    );

    const mySvg = screen.getByRole(/img/i, { name: /svg-menu-favorites/i });
    expect(mySvg).toHaveAttribute('width', '40');
    expect(mySvg).toHaveAttribute('height', '40');
  });
});
