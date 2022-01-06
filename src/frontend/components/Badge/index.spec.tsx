import React from 'react';
import { render, screen } from '@testing-library/react';

import { imageSnapshot } from 'utils/tests/imageSnapshot';

import { Badge } from '.';

describe('<StudentShowChatButton />', () => {
  it('renders the badge component', async () => {
    render(<Badge value={24} />);

    screen.getByText('24');

    const badge = screen.getByTestId('badge_container');
    expect(badge).toHaveStyle('background-color: #ffffff;');
    expect(badge).toHaveStyle('border: 1px solid #031963;');
    expect(badge).toHaveStyle('border-radius: 6px;');
    expect(badge).toHaveStyle('bottom: 2px;');
    expect(badge).toHaveStyle('color: #031963;');
    expect(badge).toHaveStyle('font-weight: bold;');
    expect(badge).toHaveStyle('padding: 3px 6px;');
    expect(badge).toHaveStyle('position: absolute;');
    expect(badge).toHaveStyle('right: -8px;');

    await imageSnapshot();
  });
});
