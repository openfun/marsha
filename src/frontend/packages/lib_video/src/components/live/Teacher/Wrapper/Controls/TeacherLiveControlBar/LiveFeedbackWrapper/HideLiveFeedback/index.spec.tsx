import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { HideLiveFeedback } from '.';

describe('<HideLiveFeedback />', () => {
  it('renders the button', async () => {
    const onClick = jest.fn();

    render(<HideLiveFeedback hideLive={onClick} />);

    expect(onClick).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Hide live feedback' }),
    );

    expect(onClick).toHaveBeenCalled();
  });
});
