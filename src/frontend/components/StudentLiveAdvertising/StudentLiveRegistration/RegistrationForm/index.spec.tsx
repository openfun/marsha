import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';

import { createLiveRegistration } from 'data/sideEffects/createLiveRegistration';
import { wrapInIntlProvider } from 'utils/tests/intl';

import { RegistrationForm } from '.';
import userEvent from '@testing-library/user-event';

const setValues = jest.fn();
const setRegistrationCompleted = jest.fn();

let matchMedia: MatchMediaMock;

jest.mock('data/sideEffects/createLiveRegistration', () => ({
  createLiveRegistration: jest.fn(),
}));
const mockCreateLiveRegistration =
  createLiveRegistration as jest.MockedFunction<typeof createLiveRegistration>;

describe('<RegistrationForm />', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
    jest.clearAllMocks();
  });

  afterEach(() => {
    matchMedia.clear();
  });

  it('renders the form without values', () => {
    const values = {
      email: undefined,
    };

    render(
      wrapInIntlProvider(
        <RegistrationForm
          values={values}
          setValues={setValues}
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox', { name: '' });
    screen.getByRole('button', { name: 'Register' });
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();
  });

  it('renders the form with initial value', () => {
    const values = {
      email: 'some.email@openfun.fr',
    };

    render(
      wrapInIntlProvider(
        <RegistrationForm
          values={values}
          setValues={setValues}
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox', { name: '' });
    screen.getByDisplayValue('some.email@openfun.fr');
    screen.getByRole('button', { name: 'Register' });
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();
  });

  it('calls parent on input change', () => {
    const values = {
      email: 'some.email@openfun.co',
    };

    render(
      wrapInIntlProvider(
        <RegistrationForm
          values={values}
          setValues={setValues}
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox', { name: '' });
    screen.getByDisplayValue('some.email@openfun.co');
    screen.getByRole('button', { name: 'Register' });
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: '' }), {
      target: { value: 'an.other.email@openfun.fr' },
    });

    expect(setValues).toHaveBeenCalledTimes(1);
    expect(setValues).toHaveBeenCalledWith({
      email: 'an.other.email@openfun.fr',
    });
    expect(setRegistrationCompleted).toHaveBeenCalledTimes(0);
  });

  it('calls parent on submit success', async () => {
    mockCreateLiveRegistration.mockResolvedValue({
      id: 'id',
      email: 'email',
      should_send_reminders: true,
      video: 'id',
    });
    const values = {
      email: 'some.email@openfun.com',
    };

    render(
      wrapInIntlProvider(
        <RegistrationForm
          values={values}
          setValues={setValues}
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    expect(mockCreateLiveRegistration).toHaveBeenCalledTimes(0);
    expect(setRegistrationCompleted).toHaveBeenCalledTimes(0);

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() =>
      expect(mockCreateLiveRegistration).toHaveBeenCalledTimes(1),
    );
    expect(setRegistrationCompleted).toHaveBeenCalledTimes(1);
  });

  it('renders the error when email is invalid', async () => {
    const values = {
      email: 'some.invalid.email@openfun.',
    };

    render(
      wrapInIntlProvider(
        <RegistrationForm
          values={values}
          setValues={setValues}
          setRegistrationCompleted={setRegistrationCompleted}
        />,
      ),
    );

    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox', { name: '' });
    screen.getByDisplayValue('some.invalid.email@openfun.');
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText('You have to submit a valid email to register.');
  });

  it('toasts an error when validation fail server side', async () => {
    mockCreateLiveRegistration.mockResolvedValue(Promise.reject('some error'));
    const values = {
      email: 'some.email@openfun.fr',
    };

    render(
      wrapInIntlProvider(
        <Fragment>
          <Toaster />
          <RegistrationForm
            values={values}
            setValues={setValues}
            setRegistrationCompleted={setRegistrationCompleted}
          />
        </Fragment>,
      ),
    );

    screen.getByRole('heading', { name: 'Email address' });
    screen.getByRole('textbox', { name: '' });
    screen.getByDisplayValue('some.email@openfun.fr');
    expect(
      screen.queryByText('You have to submit a valid email to register.'),
    ).not.toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Register' }));

    await screen.findByText(
      'Impossible to register your email some.email@openfun.fr for this event. Make sure your email is valid otherwise, please try again later or contact us.',
    );
  });
});
