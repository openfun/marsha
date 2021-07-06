import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Grommet } from 'grommet';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { ConfirmationLayer } from '.';

const props = {
  confirmationLabel: <small>Are you sure ?</small>,
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

describe('<ConfirmationLayer />', () => {
  beforeEach(() => {
    /*
      make sure to remove all body children, grommet layer gets rendered twice, known issue
      https://github.com/grommet/grommet/issues/5200
    */
    document.body.innerHTML = '';
    document.body.appendChild(document.createElement('div'));
  });

  it('renders the component and expected elements are present', () => {
    // wrap the component in a grommet provider to have a valid theme.
    render(
      wrapInIntlProvider(
        <Grommet>
          <ConfirmationLayer
            confirmationLabel={props.confirmationLabel}
            onConfirm={props.onConfirm}
            onCancel={props.onCancel}
          />
        </Grommet>,
      ),
    );
    screen.getByText(/are you sure \?/i);
    screen.getByRole('button', { name: /ok/i });
    screen.getByRole('button', { name: /cancel/i });
  });

  it('button actions get called', () => {
    // wrap the component in a grommet provider to have a valid theme.
    render(
      wrapInIntlProvider(
        <Grommet>
          <ConfirmationLayer
            confirmationLabel={props.confirmationLabel}
            onConfirm={props.onConfirm}
            onCancel={props.onCancel}
          />
        </Grommet>,
      ),
    );

    const okButton = screen.getByRole('button', { name: /ok/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    // Clicks on the ok button, onConfirm should be called
    fireEvent.click(okButton);
    expect(props.onConfirm).toHaveBeenCalled();

    // If cancel button is clicked, onCancel should be called
    fireEvent.click(cancelButton);
    expect(props.onCancel).toHaveBeenCalled();

    // Presses escape key, onCancel should be called
    fireEvent.keyDown(cancelButton, {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      charCode: 27,
    });
    expect(props.onCancel).toBeCalledTimes(2);
  });
});
