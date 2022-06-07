import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { PictureInPictureSwitchAction } from '.';

let mockPipState = { reversed: false };
const mockSetPipState = jest
  .fn()
  .mockImplementation(
    () => (mockPipState = { reversed: !mockPipState.reversed }),
  );
jest.mock('data/stores/usePictureInPicture', () => ({
  usePictureInPicture: jest
    .fn()
    .mockImplementation(() => [mockPipState, mockSetPipState]),
}));

describe('<PictureInPictureSwitchAction />', () => {
  it('renders the button', () => {
    const { rerender } = render(<PictureInPictureSwitchAction />);

    screen.getByRole('button');

    expect(mockSetPipState).not.toHaveBeenCalled();
    userEvent.click(screen.getByRole('button'));

    expect(mockSetPipState).toHaveBeenCalled();
    expect(mockSetPipState).toHaveBeenCalledWith({ reversed: true });

    rerender(<PictureInPictureSwitchAction />);

    userEvent.click(screen.getByRole('button'));
    expect(mockSetPipState).toHaveBeenCalledTimes(2);
    expect(mockSetPipState).toHaveBeenLastCalledWith({ reversed: false });
  });
});
