import { render, screen } from '@testing-library/react';
import React from 'react';

import { ClosingCard } from '.';

describe('<ClosingCard />', () => {
  test('renders ClosingCard', () => {
    render(
      <ClosingCard message="This is a nice title.">
        This is a nice children.
      </ClosingCard>,
    );

    expect(screen.getByText(/This is a nice title./i)).toBeInTheDocument();
    expect(screen.getByText(/This is a nice children./i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /close/i,
      }),
    ).toBeInTheDocument();
  });

  test('the click close the card correctly', async () => {
    render(<ClosingCard message="This is a nice title." />);

    screen
      .getByRole('button', {
        name: /close/i,
      })
      .click();

    expect(
      await screen.findByRole('alert', {
        hidden: true,
      }),
    ).toBeInTheDocument();
  });
});
