import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import AuthRouter from './AuthRouter';

jest.mock('./Login', () => ({
  Login: () => <div>My Login</div>,
}));

jest.mock('features/Footer', () => ({
  Footer: () => <div>My Footer</div>,
}));

jest.mock('./PasswordReset', () => ({
  PasswordReset: () => <div>My PasswordReset1</div>,
  PasswordResetConfirm: () => <div>My PasswordResetConfirm</div>,
}));

describe('<AuthRouter/>', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('render Login', () => {
    render(<AuthRouter />, {
      routerOptions: { history: ['/login'] },
    });
    expect(screen.getByText('My Login')).toBeInTheDocument();
    expect(screen.getByText('My Footer')).toBeInTheDocument();
  });

  test('render PasswordReset', () => {
    render(<AuthRouter />, {
      routerOptions: { history: ['/auth/password-reset'] },
    });
    expect(screen.getByText('My PasswordReset1')).toBeInTheDocument();
    expect(screen.getByText('My Footer')).toBeInTheDocument();
  });

  test('render PasswordResetConfirm', () => {
    render(<AuthRouter />, {
      routerOptions: {
        history: ['/auth/password-reset/confirm/test-uid/test-token?'],
      },
    });
    expect(screen.getByText('My PasswordResetConfirm')).toBeInTheDocument();
    expect(screen.getByText('My Footer')).toBeInTheDocument();
  });

  test('render random routes', () => {
    render(<AuthRouter />, {
      routerOptions: {
        history: ['/any-route'],
      },
    });
    expect(screen.getByText('My Login')).toBeInTheDocument();
    expect(screen.getByText('My Footer')).toBeInTheDocument();
  });
});
