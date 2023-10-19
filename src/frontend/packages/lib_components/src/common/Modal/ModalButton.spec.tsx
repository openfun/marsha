import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import ModalButton from './ModalButton';

describe('<ModalButton />', () => {
  it('displays correctly without interaction props', () => {
    render(<ModalButton>My button</ModalButton>);

    expect(screen.getByRole('button', { name: 'My button' })).toHaveAttribute(
      'type',
      'submit',
    );
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('displays correctly with isDisabled props', () => {
    render(<ModalButton isDisabled>My button</ModalButton>);
    expect(screen.getByRole('button', { name: 'My button' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('displays correctly with isSubmitting props', () => {
    render(<ModalButton isSubmitting>My button</ModalButton>);
    expect(screen.getByRole('button', { name: 'My button' })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('interacts correctly', async () => {
    const onClickSubmit = jest.fn();
    const onClickCancel = jest.fn();
    render(
      <ModalButton onClickSubmit={onClickSubmit} onClickCancel={onClickCancel}>
        My button
      </ModalButton>,
    );

    const buttonCancel = screen.getByRole('button', { name: 'Cancel' });
    expect(buttonCancel).toBeInTheDocument();
    await userEvent.click(buttonCancel);
    expect(onClickCancel).toHaveBeenCalled();

    const buttonSubmit = screen.getByRole('button', { name: 'My button' });
    expect(buttonSubmit).toBeInTheDocument();
    await userEvent.click(buttonSubmit);
    expect(onClickSubmit).toHaveBeenCalled();
  });

  it('cancels with custom label', async () => {
    const onClickCancel = jest.fn();
    render(
      <ModalButton labelCancel="My cancel" onClickCancel={onClickCancel}>
        My button
      </ModalButton>,
    );

    const buttonCancel = screen.getByRole('button', { name: 'My cancel' });
    expect(buttonCancel).toBeInTheDocument();
    await userEvent.click(buttonCancel);
    expect(onClickCancel).toHaveBeenCalled();
  });
});
