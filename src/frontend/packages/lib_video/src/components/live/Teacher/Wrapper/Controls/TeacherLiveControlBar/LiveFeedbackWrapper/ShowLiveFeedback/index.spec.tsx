import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { ShowLiveFeedback } from '.';

describe('<ShowLiveFeedback />', () => {
  it('renders the button', async () => {
    const onClick = jest.fn();

    render(<ShowLiveFeedback showLive={onClick} />);

    expect(onClick).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: 'Show live feedback' }),
    );

    expect(onClick).toHaveBeenCalled();
  });
});
