import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { ConfirmationModal } from '.';

const mockModalOnCloseOrCancel = jest.fn();
const mockModalConfirm = jest.fn();
const genericTitle = 'A generic title';
const genericContent =
  'A generic content, which has for purpose to represent an example of an average string used in this modal. It has too be not too short, but also not too long.';

const keyCodes = {
  Escape: 27,
} as any;
function patchKeyEvent(e: { code: string | number }) {
  Object.defineProperty(e, 'keyCode', {
    get: () => keyCodes[e.code] ?? 0,
  });
}

describe('<ConfirmationModal />', () => {
  beforeEach(() => {
    document.addEventListener('keydown', patchKeyEvent, { capture: true });
    jest.resetAllMocks();
  });

  it('renders the modal and closes it with esc key', async () => {
    render(
      <ConfirmationModal
        text={genericContent}
        title={genericTitle}
        onModalCloseOrCancel={mockModalOnCloseOrCancel}
        onModalConfirm={mockModalConfirm}
      />,
    );
    screen.getByText(genericTitle);
    screen.getByText(genericContent);
    screen.getByRole('button', { name: '' });
    screen.getByRole('button', { name: 'Confirm' });
    screen.getByRole('button', { name: 'Cancel' });

    await userEvent.keyboard('{Escape}');

    expect(mockModalOnCloseOrCancel).toHaveBeenCalledTimes(1);
    expect(mockModalConfirm).not.toHaveBeenCalled();
  });

  it('renders the modal and closes it with close button', async () => {
    render(
      <ConfirmationModal
        text={genericContent}
        title={genericTitle}
        onModalCloseOrCancel={mockModalOnCloseOrCancel}
        onModalConfirm={mockModalConfirm}
      />,
    );
    screen.getByRole('button', { name: 'Confirm' });
    screen.getByRole('button', { name: 'Cancel' });
    const closeButton = screen.getByRole('button', { name: '' });

    await userEvent.click(closeButton);

    expect(mockModalOnCloseOrCancel).toHaveBeenCalledTimes(1);
    expect(mockModalConfirm).not.toHaveBeenCalled();
  });

  it('renders the modal and closes it with cancel button', async () => {
    render(
      <ConfirmationModal
        text={genericContent}
        title={genericTitle}
        onModalCloseOrCancel={mockModalOnCloseOrCancel}
        onModalConfirm={mockModalConfirm}
      />,
    );
    screen.getByText(genericTitle);
    screen.getByText(genericContent);
    screen.getByRole('button', { name: '' });
    screen.getByRole('button', { name: 'Confirm' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    await userEvent.click(cancelButton);

    expect(mockModalOnCloseOrCancel).toHaveBeenCalledTimes(1);
    expect(mockModalConfirm).not.toHaveBeenCalled();
  });

  it('renders the modal and clicks on confirm button', async () => {
    render(
      <ConfirmationModal
        text={genericContent}
        title={genericTitle}
        onModalCloseOrCancel={mockModalOnCloseOrCancel}
        onModalConfirm={mockModalConfirm}
      />,
    );
    screen.getByText(genericTitle);
    screen.getByText(genericContent);
    screen.getByRole('button', { name: '' });
    screen.getByRole('button', { name: 'Cancel' });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    await userEvent.click(confirmButton);

    expect(mockModalOnCloseOrCancel).not.toHaveBeenCalled();
    expect(mockModalConfirm).toHaveBeenCalledTimes(1);
  });
});
