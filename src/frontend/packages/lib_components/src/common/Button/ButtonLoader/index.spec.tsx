import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { ButtonLoader } from '.';

describe('<ButtonLoader />', () => {
  it('displays correctly without interaction props', () => {
    render(<ButtonLoader label="My button" />);

    expect(screen.getByRole('button', { name: 'My button' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('displays correctly with isDisabled props', () => {
    render(<ButtonLoader label="My button" isDisabled />);
    expect(screen.getByRole('button', { name: 'My button' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('displays correctly with isSubmitting props', () => {
    render(<ButtonLoader label="My button" isSubmitting />);
    expect(screen.getByRole('button', { name: 'My button' })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('interacts correctly', () => {
    const onClickSubmit = jest.fn();
    render(<ButtonLoader label="My button" onClickSubmit={onClickSubmit} />);

    const buttonSubmit = screen.getByRole('button', { name: 'My button' });
    expect(buttonSubmit).toBeInTheDocument();
    userEvent.click(buttonSubmit);
    expect(onClickSubmit).toHaveBeenCalled();
  });
});
