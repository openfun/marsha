import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { PictureInPictureSwitchAction } from '.';

let mockPipState = { reversed: false };
const mockSetPipState = jest
  .fn()
  .mockImplementation(
    () => (mockPipState = { reversed: !mockPipState.reversed }),
  );
jest.mock('hooks/usePictureInPicture', () => ({
  usePictureInPicture: jest
    .fn()
    .mockImplementation(() => [mockPipState, mockSetPipState]),
}));

describe('<PictureInPictureSwitchAction />', () => {
  it('renders the button', async () => {
    const { rerender } = render(<PictureInPictureSwitchAction />);

    screen.getByRole('button', { name: 'Show document' });

    expect(mockSetPipState).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Show document' }),
    );

    expect(mockSetPipState).toHaveBeenCalled();
    expect(mockSetPipState).toHaveBeenCalledWith({ reversed: true });

    rerender(<PictureInPictureSwitchAction />);

    await userEvent.click(screen.getByRole('button', { name: 'Show player' }));
    expect(mockSetPipState).toHaveBeenCalledTimes(2);
    expect(mockSetPipState).toHaveBeenLastCalledWith({ reversed: false });
  });
});
