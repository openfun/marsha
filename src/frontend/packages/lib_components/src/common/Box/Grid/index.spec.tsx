import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { Grid } from './';

describe('<Grid />', () => {
  it('renders the default component and children', () => {
    render(<Grid aria-label="my-label-grid">My Grid</Grid>);

    const grid = screen.getByText('My Grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('typo-grid');
  });

  it('has `columns` prop as number', () => {
    render(<Grid columns={30}>My Grid</Grid>);

    expect(screen.getByText('My Grid')).toHaveStyle(
      'grid-template-columns: repeat(auto-fill, minmax(min(30px, 100%), 1fr));',
    );
  });

  it('has `columns` prop as string px', () => {
    render(<Grid columns="45px">My Grid</Grid>);

    expect(screen.getByText('My Grid')).toHaveStyle(
      'grid-template-columns: repeat(auto-fill, minmax(min(45px, 100%), 1fr));',
    );
  });

  it('has `columns` prop as string auto', () => {
    render(<Grid columns="auto">My Grid</Grid>);

    expect(screen.getByText('My Grid')).toHaveStyle(
      'grid-template-columns: repeat(auto-fill, minmax(auto, 1fr));',
    );
  });

  it('has `columns` prop as ColumnsCount type', () => {
    render(<Grid columns={{ count: 2, size: 30 }}>My Grid</Grid>);

    expect(screen.getByText('My Grid')).toHaveStyle(
      'grid-template-columns: repeat(2, minmax(min(30px, 100%), 1fr));',
    );
  });
});
