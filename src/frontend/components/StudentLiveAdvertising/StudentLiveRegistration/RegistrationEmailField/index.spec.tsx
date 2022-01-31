import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { RegistrationEmailField } from '.';

describe('<RegistrationEmailField />', () => {
  it('renders properly', () => {
    render(
      wrapInIntlProvider(
        <RegistrationEmailField inputLabel="input label" id="input id">
          <h2>additional content</h2>
        </RegistrationEmailField>,
      ),
    );

    screen.getByRole('heading', { name: 'input label' });
    screen.getByRole('heading', { name: 'additional content' });
    screen.getByPlaceholderText('example@openfun.fr');
    screen.getByRole('textbox', { name: '' });
  });
});
