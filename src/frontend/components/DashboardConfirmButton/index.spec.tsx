import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Grommet } from 'grommet';
import { wrapInIntlProvider } from '../../utils/tests/intl';
import { DashboardConfirmButton } from '.';

const props = {
  confirmationLabel: <small>Are you sure ?</small>,
  label: <span>Start a live</span>,
  onConfirm: jest.fn(),
};

jest.mock('../../data/appData', () => ({
  appData: {},
}));

describe('<DashboardConfirmButton />', () => {
  afterEach(jest.resetAllMocks);
  beforeEach(() => {
    /*
      make sure to remove all body children, grommet layer gets rendered twice, known issue
      https://github.com/grommet/grommet/issues/5200
    */
    document.body.innerHTML = '';
    document.body.appendChild(document.createElement('div'));
  });

  it('renders the component and expected elements are present', () => {
    render(
      wrapInIntlProvider(
        <DashboardConfirmButton
          confirmationLabel={props.confirmationLabel}
          label={props.label}
          onConfirm={props.onConfirm}
        />,
      ),
    );
    const button = screen.getByRole('button', {
      name: /start a live/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('renders the component and expected elements are present and the button is disabled', () => {
    render(
      wrapInIntlProvider(
        <DashboardConfirmButton
          confirmationLabel={props.confirmationLabel}
          disabled={true}
          label={props.label}
          onConfirm={props.onConfirm}
        />,
      ),
    );
    const button = screen.getByRole('button', {
      name: /start a live/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('renders the confirmation box when the button is fired', () => {
    // wrap the component in a grommet provider to have a valid theme.
    render(
      wrapInIntlProvider(
        <Grommet>
          <DashboardConfirmButton
            confirmationLabel={props.confirmationLabel}
            label={props.label}
            onConfirm={props.onConfirm}
          />
        </Grommet>,
      ),
    );

    const startButton = screen.getByRole('button', { name: /start a live/i });

    // Clicks on ok start button, confirmation layer should show up
    fireEvent.click(startButton);

    screen.getByText(/are you sure \?/i);
    screen.getByRole('button', { name: /ok/i });
    screen.getByRole('button', { name: /cancel/i });

    const okButton = screen.getByRole('button', { name: /ok/i });

    fireEvent.click(okButton);
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it('renders the confirmation box when the button is fired and call onConfirm when ok is pressed', () => {
    // wrap the component in a grommet provider to have a valid theme.
    render(
      wrapInIntlProvider(
        <Grommet>
          <DashboardConfirmButton
            confirmationLabel={props.confirmationLabel}
            label={props.label}
            onConfirm={props.onConfirm}
          />
        </Grommet>,
      ),
    );

    const startButton = screen.getByRole('button', { name: /start a live/i });

    // Clicks on start button, confirmation layer should show up
    fireEvent.click(startButton);

    screen.getByText(/are you sure \?/i);
    const okButton = screen.getByRole('button', { name: /ok/i });
    screen.getByRole('button', { name: /cancel/i });

    // Clicks on ok button, onConfirm should be called
    fireEvent.click(okButton);
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it('renders the confirmation box when the button is fired and onConfirm is not called by clicking the cancel button ', () => {
    // wrap the component in a grommet provider to have a valid theme.
    render(
      wrapInIntlProvider(
        <Grommet>
          <DashboardConfirmButton
            confirmationLabel={props.confirmationLabel}
            label={props.label}
            onConfirm={props.onConfirm}
          />
        </Grommet>,
      ),
    );

    const startButton = screen.getByRole('button', { name: /start a live/i });

    // Clicks on start button, confirmation layer should show up
    fireEvent.click(startButton);

    screen.getByText(/are you sure \?/i);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    // Clicks on cancel button, onConfirm should not be called
    fireEvent.click(cancelButton);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });
});
