import React from 'react';
import { render, screen } from '@testing-library/react';

import { ButtonLayout } from '.';

const Icon = jest.fn(() => <span>icon</span>);
const badge = 'badge';

describe('<ButtonLayout />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Button component with its title only', () => {
    render(
      <ButtonLayout
        label="Button"
        reversedColor={'reversed-color'}
        textColor={'text-color'}
        tintColor={'int-color'}
      />,
    );

    screen.getByText('Button');
    expect(screen.queryByText('badge')).not.toBeInTheDocument();
    expect(screen.queryByText('icon')).not.toBeInTheDocument();
  });

  it('does not render the badge if there is no Icon set', () => {
    render(
      <ButtonLayout
        badge={badge}
        label="Button"
        reversedColor={'reversed-color'}
        tintColor={'int-color'}
        textColor={'text-color'}
      />,
    );

    screen.getByText('Button');
    expect(screen.queryByText('badge')).not.toBeInTheDocument();
    expect(screen.queryByText('icon')).not.toBeInTheDocument();
  });

  it('renders the icon when set', () => {
    render(
      <ButtonLayout
        Icon={() => <span>icon</span>}
        label="Button"
        reversedColor={'reversed-color'}
        tintColor={'int-color'}
        textColor={'text-color'}
      />,
    );

    screen.getByText('Button');
    expect(screen.queryByText('badge')).not.toBeInTheDocument();
    screen.getByText('icon');
  });

  it('renders the icon and the badge and the title', () => {
    render(
      <ButtonLayout
        badge={badge}
        Icon={() => <span>icon</span>}
        label="Button"
        reversedColor={'reversed-color'}
        tintColor={'int-color'}
        textColor={'text-color'}
      />,
    );

    screen.getByText('Button');
    screen.getByText('icon');
    screen.getByText('badge');
  });

  it('renders the Button component with default style', () => {
    render(
      <ButtonLayout
        badge={badge}
        Icon={Icon}
        label="Button"
        reversedColor={'#ffffff'}
        tintColor={'#0a67de'}
        textColor={'#0a67de'}
      />,
    );

    screen.getByText('Button');

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalled();
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        height: '100%',
        iconColor: '#0a67de',
        focusColor: undefined,
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with reversed style', () => {
    render(
      <ButtonLayout
        badge={badge}
        Icon={Icon}
        label="Button"
        reversed
        reversedColor={'#ffffff'}
        tintColor={'#031963'}
        textColor={'#0a67de'}
      />,
    );

    screen.getByText('Button');

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalled();
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        height: '100%',
        iconColor: '#ffffff',
        focusColor: '#031963',
      },
      {},
    );

    screen.getByText('badge');
  });
});
