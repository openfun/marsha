import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import LiveRouter from './LiveRouter';

jest.mock('./Read/Lives', () => ({
  __esModule: true,
  default: () => <div>My Lives Read</div>,
}));

describe('<LiveRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render route /my-contents/webinars', () => {
    render(<LiveRouter />, {
      routerOptions: { history: ['/my-contents/webinars'] },
    });

    expect(
      screen.getByRole('button', { name: 'Create Webinar' }),
    ).toBeInTheDocument();
    expect(screen.getByText('My Lives Read')).toBeInTheDocument();
  });

  test('render create live', async () => {
    render(<LiveRouter />, {
      routerOptions: { history: ['/my-contents/webinars/create'] },
    });
    expect(
      await screen.findByRole('heading', {
        name: 'Create Webinar',
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/My Lives Read/i)).toBeInTheDocument();
  });

  test('render live no match', () => {
    render(<LiveRouter />, {
      routerOptions: { history: ['/some/bad/route'] },
    });

    expect(
      screen.queryByRole('button', { name: 'Create Webinar' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('My Lives Read')).not.toBeInTheDocument();
  });
});
