import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import React from 'react';

import { HideLiveFeedback } from '.';

describe('<HideLiveFeedback />', () => {
  it('renders the button', () => {
    const onClick = jest.fn();

    render(<HideLiveFeedback hideLive={onClick} />);

    expect(onClick).not.toHaveBeenCalled();

    userEvent.click(screen.getByRole('button', { name: 'Hide live feedback' }));

    expect(onClick).toHaveBeenCalled();
  });
});
