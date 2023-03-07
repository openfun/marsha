import { render, screen } from '@testing-library/react';
import React from 'react';

import { ContentCard } from '.';

describe('<ContentCard />', () => {
  test('renders ContentCard', () => {
    render(
      <ContentCard
        header="This is a nice header."
        title="This is a nice title."
        footer="This is a nice footer."
      >
        This is a nice children.
      </ContentCard>,
    );

    expect(screen.getByText(/This is a nice header./i)).toBeInTheDocument();
    expect(screen.getByText(/This is a nice title./i)).toBeInTheDocument();
    expect(screen.getByText(/This is a nice footer./i)).toBeInTheDocument();
    expect(screen.getByText(/This is a nice children./i)).toBeInTheDocument();
  });
});
