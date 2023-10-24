import { screen } from '@testing-library/react';
import { colorsTokens } from 'lib-common';
import { render } from 'lib-tests';

import { Box } from '.';

describe('<Box />', () => {
  it('renders the default component and children', () => {
    render(<Box>My Box</Box>);

    const box = screen.getByText('My Box');
    expect(box).toBeInTheDocument();
    expect(box).toHaveClass('typo-box');
    expect(box.tagName).toBe('DIV');
    expect(box).toHaveStyle(`flexDirection: column;`);
  });

  it('has the classname from the prop', () => {
    render(<Box className="my-classname">My Box</Box>);

    expect(screen.getByText('My Box')).toHaveClass('my-classname');
  });

  it('has typo props inheritance', () => {
    render(<Box margin="5px">My Box</Box>);

    expect(screen.getByText('My Box')).toHaveStyle('margin: 5px');
  });

  it('has article tag', () => {
    render(<Box type="article">My Box</Box>);

    expect(screen.getByText('My Box').tagName).toBe('ARTICLE');
  });

  it('has elevation prop', () => {
    render(<Box elevation>My Box</Box>);

    expect(screen.getByText('My Box')).toHaveStyle(
      `boxShadow: 0 2px 6px ${colorsTokens['primary-500']}44;`,
    );
  });

  it('has gap prop', () => {
    render(<Box gap="2px">My Box</Box>);

    expect(screen.getByText('My Box')).toHaveStyle(`gap: 2px`);
  });

  it('has round prop', () => {
    render(<Box round="2px">My Box</Box>);

    expect(screen.getByText('My Box')).toHaveStyle(`border-radius: 2px`);
  });
});
