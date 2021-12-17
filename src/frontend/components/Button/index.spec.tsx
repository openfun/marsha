import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { Button } from '.';

describe('<Button />', () => {
  it('renders the Button component with its title only', () => {
    render(<Button label="Button" />);

    screen.getByRole('button');
    screen.getByRole('button_title');
    expect(screen.queryByRole('icon_container')).not.toBeInTheDocument();
    expect(screen.queryByRole('icon_resizer')).not.toBeInTheDocument();
  });

  it('calls onCLick when clicking the button', () => {
    const onClick = jest.fn();

    render(<Button label="Button" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render the badge if there is no Icon set', () => {
    const Badge = () => <span>badge</span>;

    render(<Button label="Button" badge={<Badge />} />);

    screen.getByRole('button');
    screen.getByRole('button_title');
    expect(screen.queryByRole('icon_container')).not.toBeInTheDocument();
    expect(screen.queryByRole('icon_resizer')).not.toBeInTheDocument();
    expect(screen.queryByText('badge')).not.toBeInTheDocument();
  });

  it('renders the Button component with default style', () => {
    const Icon = jest.fn(
      ({}: { containerStyle?: React.CSSProperties; iconColor: string }) => (
        <span>icon</span>
      ),
    );
    const Badge = () => <span>badge</span>;

    render(<Button label="Button" Icon={Icon} badge={<Badge />} />);

    screen.getByRole('button');
    screen.getByRole('button_title');
    screen.getByRole('icon_container');
    screen.getByRole('icon_resizer');

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        containerStyle: {
          background: 'none',
          width: '0px',
        },
        iconColor: '#055fd2',
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with default style disabled', () => {
    const Icon = jest.fn(
      ({}: { containerStyle?: React.CSSProperties; iconColor: string }) => (
        <span>icon</span>
      ),
    );
    const Badge = () => <span>badge</span>;

    render(<Button label="Button" Icon={Icon} badge={<Badge />} disabled />);

    screen.getByRole('button');
    screen.getByRole('button_title');
    screen.getByRole('icon_container');
    screen.getByRole('icon_resizer');

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        containerStyle: {
          background: 'none',
          width: '0px',
        },
        iconColor: '#81ade6',
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with default style hovered', () => {
    const Icon = jest.fn(
      ({}: { containerStyle?: React.CSSProperties; iconColor: string }) => (
        <span>icon</span>
      ),
    );
    const Badge = () => <span>badge</span>;

    render(<Button label="Button" Icon={Icon} badge={<Badge />} />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    screen.getByRole('button');
    screen.getByRole('button_title');
    screen.getByRole('icon_container');
    screen.getByRole('icon_resizer');

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(2);
    expect(Icon).toHaveBeenNthCalledWith(
      1,
      {
        containerStyle: {
          background: 'none',
          width: '0px',
        },
        iconColor: '#055fd2',
      },
      {},
    );
    expect(Icon).toHaveBeenNthCalledWith(
      2,
      {
        containerStyle: {
          background: '#031963',
          borderRadius: '6px',
          width: '0px',
        },
        iconColor: '#ffffff',
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with reversed style', () => {
    const Icon = jest.fn(
      ({}: { containerStyle?: React.CSSProperties; iconColor: string }) => (
        <span>icon</span>
      ),
    );
    const Badge = () => <span>badge</span>;

    render(<Button label="Button" Icon={Icon} badge={<Badge />} reversed />);

    screen.getByRole('button');
    screen.getByRole('button_title');
    screen.getByRole('icon_container');
    screen.getByRole('icon_resizer');

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        containerStyle: {
          background: '#031963',
          borderRadius: '6px',
          width: '0px',
        },
        iconColor: '#ffffff',
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with reversed style disabled', () => {
    const Icon = jest.fn(
      ({}: { containerStyle?: React.CSSProperties; iconColor: string }) => (
        <span>icon</span>
      ),
    );
    const Badge = () => <span>badge</span>;

    render(
      <Button label="Button" Icon={Icon} badge={<Badge />} disabled reversed />,
    );

    screen.getByRole('button');
    screen.getByRole('button_title');
    screen.getByRole('icon_container');
    screen.getByRole('icon_resizer');

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(1);
    expect(Icon).toHaveBeenCalledWith(
      {
        containerStyle: {
          background: '#81ade6',
          borderRadius: '6px',
          width: '0px',
        },
        iconColor: '#ffffff',
      },
      {},
    );

    screen.getByText('badge');
  });

  it('renders the Button component with reversed style hovered', () => {
    const Icon = jest.fn(
      ({}: { containerStyle?: React.CSSProperties; iconColor: string }) => (
        <span>icon</span>
      ),
    );
    const Badge = () => <span>badge</span>;

    render(<Button label="Button" Icon={Icon} badge={<Badge />} reversed />);

    fireEvent.mouseEnter(screen.getByRole('button'));

    screen.getByRole('button');
    screen.getByRole('button_title');
    screen.getByRole('icon_container');
    screen.getByRole('icon_resizer');

    screen.getByText('icon');
    expect(Icon).toHaveBeenCalledTimes(2);
    expect(Icon).toHaveBeenNthCalledWith(
      1,
      {
        containerStyle: {
          background: '#031963',
          borderRadius: '6px',
          width: '0px',
        },
        iconColor: '#ffffff',
      },
      {},
    );
    expect(Icon).toHaveBeenNthCalledWith(
      2,
      {
        containerStyle: {
          background: 'none',
          width: '0px',
        },
        iconColor: '#055fd2',
      },
      {},
    );

    screen.getByText('badge');
  });
});
