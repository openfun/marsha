import { fireEvent, screen } from '@testing-library/react';
import { render } from 'lib-tests';
import React from 'react';

import { Button } from '.';

const Icon = jest.fn(() => <span>icon</span>);
const badge = 'badge';

describe('<Button />', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Button component with its title only', () => {
    render(<Button label="Button" />);

    expect(screen.getByRole('button', { name: /Button/i })).toBeInTheDocument();
  });

  it('calls onCLick when clicking the button', () => {
    const onClick = jest.fn();

    render(<Button label="Button" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: /Button/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render the badge if there is no Icon set', () => {
    render(<Button label="Button" badge={badge} />);

    screen.getByRole('button', { name: /Button/i });
    expect(screen.queryByText('badge')).not.toBeInTheDocument();
  });

  it('renders the Button component with default style', () => {
    render(<Button label="Button" Icon={Icon} badge={badge} />);

    screen.getByRole('button', { name: /Button/i });

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        height: '100%',
        iconColor: '#031963',
        focusColor: undefined,
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with default style disabled', () => {
    render(<Button label="Button" Icon={Icon} badge={badge} disabled />);

    screen.getByRole('button', { name: /Button/i });

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        height: '100%',
        iconColor: '#81ade6',
        focusColor: undefined,
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with default style hovered', () => {
    render(<Button label="Button" Icon={Icon} badge={badge} />);

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Button/i }));

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(2);
    expect(Icon).toHaveBeenNthCalledWith(
      1,
      {
        height: '100%',
        iconColor: '#031963',
        focusColor: undefined,
      },
      {},
    );
    expect(Icon).toHaveBeenNthCalledWith(
      2,
      {
        height: '100%',
        iconColor: '#ffffff',
        focusColor: '#055fd2',
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with reversed style', () => {
    render(<Button label="Button" Icon={Icon} badge={badge} reversed />);

    screen.getByRole('button', { name: /Button/i });

    screen.getByText('icon');
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

  it('renders the Button component with reversed style disabled', () => {
    render(
      <Button label="Button" Icon={Icon} badge={badge} disabled reversed />,
    );

    screen.getByRole('button', { name: /Button/i });

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        height: '100%',
        iconColor: '#ffffff',
        focusColor: '#81ade6',
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with reversed style hovered', () => {
    render(<Button label="Button" Icon={Icon} badge={badge} reversed />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    screen.getByRole('button', { name: /Button/i });

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(2);
    expect(Icon).toHaveBeenNthCalledWith(
      1,
      {
        height: '100%',
        iconColor: '#ffffff',
        focusColor: '#031963',
      },
      {},
    );
    expect(Icon).toHaveBeenNthCalledWith(
      2,
      {
        height: '100%',
        iconColor: '#ffffff',
        focusColor: '#055fd2',
      },
      {},
    );

    screen.getByText('badge');
  });
});
