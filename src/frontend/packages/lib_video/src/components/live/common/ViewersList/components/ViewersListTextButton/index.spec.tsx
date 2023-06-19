import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { ViewersListTextButton } from '.';

const mockOnClick = jest.fn();

describe('<ViewersListTextButton />', () => {
  beforeEach(() => jest.resetAllMocks());

  it('renders ViewersListTextButton component and clicks on it', async () => {
    render(
      <ViewersListTextButton onClick={mockOnClick} text="An example text" />,
    );
    screen.getByText('An example text');
    const button = screen.getByRole('button', { name: 'An example text' });

    await userEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
