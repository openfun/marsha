import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import ModaleButton from './ModalButton';

describe('<ModalButton />', () => {
  it('displays correctly without interaction props', () => {
    render(<ModaleButton label="My button" />);

    expect(screen.getByRole('button', { name: 'My button' })).toHaveAttribute(
      'type',
      'submit',
    );
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('displays correctly with isDisabled props', () => {
    render(<ModaleButton label="My button" isDisabled />);
    expect(screen.getByRole('button', { name: 'My button' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('displays correctly with isSubmitting props', () => {
    render(<ModaleButton label="My button" isSubmitting />);
    expect(screen.getByRole('button', { name: 'My button' })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('interacts correctly', () => {
    const onClickSubmit = jest.fn();
    const onClickCancel = jest.fn();
    render(
      <ModaleButton
        label="My button"
        onClickSubmit={onClickSubmit}
        onClickCancel={onClickCancel}
      />,
    );

    const buttonCancel = screen.getByRole('button', { name: 'Cancel' });
    expect(buttonCancel).toBeInTheDocument();
    userEvent.click(buttonCancel);
    expect(onClickCancel).toHaveBeenCalled();

    const buttonSubmit = screen.getByRole('button', { name: 'My button' });
    expect(buttonSubmit).toBeInTheDocument();
    userEvent.click(buttonSubmit);
    expect(onClickSubmit).toHaveBeenCalled();
  });

  it('cancels with custom label', () => {
    const onClickCancel = jest.fn();
    render(
      <ModaleButton
        label="My button"
        labelCancel="My cancel"
        onClickCancel={onClickCancel}
      />,
    );

    const buttonCancel = screen.getByRole('button', { name: 'My cancel' });
    expect(buttonCancel).toBeInTheDocument();
    userEvent.click(buttonCancel);
    expect(onClickCancel).toHaveBeenCalled();
  });
});
