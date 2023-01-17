import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { SettingsProfilePage } from './SettingsProfilePage';

describe('<SettingsProfilePage />', () => {
  it('renders only account settings', () => {
    render(<SettingsProfilePage />);

    expect(
      screen.getByRole('heading', { name: 'Update my password' }),
    ).toBeInTheDocument();
  });
});
