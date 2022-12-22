import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { PasswordReset } from './PasswordReset';

jest.mock('./PasswordResetForm', () => ({
  PasswordResetForm: () => <div>My PasswordResetForm</div>,
}));

describe('<PasswordReset />', () => {
  it('checks render.', () => {
    render(<PasswordReset />);

    expect(screen.getByLabelText(/Marsha logo/i)).toBeInTheDocument();
    expect(screen.getByText(/My PasswordResetForm/i)).toBeInTheDocument();
  });
});
