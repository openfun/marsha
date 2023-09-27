import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { Badge } from '.';

describe('<Badge />', () => {
  it('renders the badge component', () => {
    render(<Badge value="24" />);

    screen.getByText('24');

    const badge = screen.getByTestId('badge_container');
    expect(badge).toHaveStyle('background-color: #ffffff;');
    expect(badge).toHaveStyle('border: 1px solid #031963;');
    expect(badge).toHaveStyle('border-radius: 6px;');
    expect(badge).toHaveStyle('bottom: 0px;');
    expect(badge).toHaveStyle('color: #031963;');
    expect(badge).toHaveStyle('padding: 1px 3px;');
    expect(badge).toHaveStyle('position: absolute;');
    expect(badge).toHaveStyle('right: -8px;');
  });
});
