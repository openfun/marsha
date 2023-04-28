import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { Login } from './Login';

jest.mock('./LoginForm', () => ({
  LoginForm: () => <div>My LoginForm</div>,
}));

jest.mock('./RenaterAuthenticator', () => ({
  RenaterAuthenticator: () => <div>My RenaterAuthenticator</div>,
}));

describe('<Login />', () => {
  it('checks render.', () => {
    render(<Login />);

    expect(screen.getByText(/My LoginForm/i)).toBeInTheDocument();
    expect(screen.getByText(/My RenaterAuthenticator/i)).toBeInTheDocument();
  });
});
