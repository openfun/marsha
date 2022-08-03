import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import render from 'utils/tests/render';

import { ConfirmationModal } from '.';

const mockModalOnCloseOrCancel = jest.fn();
const mockModalConfirm = jest.fn();
const genericTitle = 'A generic title';
const genericContent =
  'A generic content, which has for purpose to represent an example of an average string used in this modal. It has too be not too short, but also not too long.';

describe('<ConfirmationModal />', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the modal and closes it with esc key', () => {
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
    act(() => {
      userEvent.keyboard('{esc}');
    });
    expect(mockModalOnCloseOrCancel).toHaveBeenCalledTimes(1);
    expect(mockModalConfirm).not.toHaveBeenCalled();
  });

  it('renders the modal and closes it with close button', () => {
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
    act(() => {
      userEvent.click(closeButton);
    });
    expect(mockModalOnCloseOrCancel).toHaveBeenCalledTimes(1);
    expect(mockModalConfirm).not.toHaveBeenCalled();
  });

  it('renders the modal and closes it with cancel button', () => {
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
    act(() => {
      userEvent.click(cancelButton);
    });
    expect(mockModalOnCloseOrCancel).toHaveBeenCalledTimes(1);
    expect(mockModalConfirm).not.toHaveBeenCalled();
  });

  it('renders the modal and clicks on confirm button', () => {
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
    act(() => {
      userEvent.click(confirmButton);
    });
    expect(mockModalOnCloseOrCancel).not.toHaveBeenCalled();
    expect(mockModalConfirm).toHaveBeenCalledTimes(1);
  });
});
