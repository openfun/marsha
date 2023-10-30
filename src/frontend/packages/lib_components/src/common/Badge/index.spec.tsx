import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import { Badge } from '.';

describe('<Badge />', () => {
  it('renders the badge component', () => {
    render(<Badge value="24" />);

    screen.getByText('24');

    const badge = screen.getByTestId('badge_container');
    expect(badge).toHaveStyle({
      'background-color': 'rgb(5, 95, 210)',
      'border-radius': '100%',
      position: 'absolute',
      top: '0px',
      right: '0px',
    });
  });
});
