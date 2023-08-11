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

    await userEvent.click(
      screen.getByRole('button', { name: 'Show the password.' }),
    );

    await userEvent.type(
      await screen.findByRole('textbox', { name: 'label' }),
      'some password',
    );

    const input = await screen.findByDisplayValue('some password');
    expect(input).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Hide the password.' }),
    );

    await waitFor(() =>
      expect(screen.queryByText('some password')).not.toBeInTheDocument(),
    );
  });
});
