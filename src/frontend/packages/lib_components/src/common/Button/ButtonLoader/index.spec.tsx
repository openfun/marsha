import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';

import { ButtonLoader } from '.';

describe('<ButtonLoader />', () => {
  it('displays correctly without interaction props', () => {
    render(<ButtonLoader>My button</ButtonLoader>);

    expect(screen.getByRole('button', { name: 'My button' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('displays correctly with isDisabled props', () => {
    render(<ButtonLoader isDisabled>My button</ButtonLoader>);
    expect(screen.getByRole('button', { name: 'My button' })).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('displays correctly with isSubmitting props', () => {
    render(<ButtonLoader isSubmitting>My button</ButtonLoader>);
    expect(screen.getByRole('button', { name: 'My button' })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('interacts correctly', async () => {
    const onClickSubmit = jest.fn();
    render(
      <ButtonLoader onClickSubmit={onClickSubmit}>My button</ButtonLoader>,
    );

    const buttonSubmit = screen.getByRole('button', { name: 'My button' });
    expect(buttonSubmit).toBeInTheDocument();
    await userEvent.click(buttonSubmit);
    expect(onClickSubmit).toHaveBeenCalled();
  });
});
