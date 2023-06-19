import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { AddUserAccessButton } from './AddUserAccessButton';

describe('AddUserAccessButton', () => {
  it('opens AddUserAccessForm', async () => {
    render(<AddUserAccessButton playlistId="1" />);
    expect(
      screen.queryByRole('heading', { name: 'Add member' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add people' }));
    expect(
      screen.getByRole('heading', { name: 'Add member' }),
    ).toBeInTheDocument();
  });
});
