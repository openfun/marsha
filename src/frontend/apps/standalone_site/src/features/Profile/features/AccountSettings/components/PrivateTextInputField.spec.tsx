import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from 'lib-components';
import { render } from 'lib-tests';

import { PrivateTextInputField } from './PrivateTextInputField';

describe('<PrivateTextInputField />', () => {
  it('render a password fiel with the switch button', async () => {
    render(
      <Form onSubmit={jest.fn()} onSubmitError={jest.fn()}>
        <PrivateTextInputField id="id" name="name" label="label" />
      </Form>,
    );

    expect(screen.getByLabelText('label')).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'show-content.svg' }));

    userEvent.type(
      await screen.findByRole('textbox', { name: 'label' }),
      'some password',
    );

    const input = await screen.findByDisplayValue('some password');
    expect(input).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'hide-content.svg' }));

    await waitFor(() =>
      expect(screen.queryByText('some password')).not.toBeInTheDocument(),
    );
  });
});
