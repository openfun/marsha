import { render, screen } from '@testing-library/react';
import React from 'react';

import { wrapInIntlProvider } from 'utils/tests/intl';
import { WaitingLiveVideo } from '.';

describe('WaitingLiveVideo', () => {
  it('renders the component', () => {
    render(wrapInIntlProvider(<WaitingLiveVideo />));

    screen.getByText('Live will begin soon');
    screen.getByText(
      'The live is going to start. You can wait here, the player will start once the live is ready.',
    );
  });
});
