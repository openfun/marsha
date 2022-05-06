import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { useFetchButton } from './useFetchButton';

const matchMedia = new MatchMediaMock();

describe('useFetchButton', () => {
  afterEach(() => {
    matchMedia.clear();
  });

  it('renders the button', () => {
    const TestHelper = () => {
      const [_state, _setState, Button] = useFetchButton();

      return <Button label="my label" />;
    };

    render(wrapInIntlProvider(<TestHelper />));

    screen.getByRole('button', { name: 'my label' });
  });

  it('updates the state to loading on button click, disables the button and displays the loader', async () => {
    const TestHelper = () => {
      const [state, _setState, Button] = useFetchButton();

      return (
        <Fragment>
          {state.type === 'loading' && <p>button is loading</p>}
          <Button label="my label" />
        </Fragment>
      );
    };

    render(wrapInIntlProvider(<TestHelper />));

    userEvent.click(screen.getByRole('button', { name: 'my label' }));

    await screen.findByText('button is loading');
    expect(screen.getByRole('button', { name: 'my label' })).toBeDisabled();
    screen.getByTestId('loader-id');
  });

  it('toasts default error message and resets the state', async () => {
    const TestHelper = () => {
      const [state, setState, Button] = useFetchButton();

      useEffect(() => {
        setState({ type: 'error', error: 'some error' });
      }, []);

      return (
        <Fragment>
          {state.type === 'idle' && <p>button is idling</p>}
          <Button label="my label" />
        </Fragment>
      );
    };

    render(
      wrapInIntlProvider(
        <Fragment>
          <TestHelper />
          <Toaster />
        </Fragment>,
      ),
    );

    //  toast error
    await screen.findByText('An error occurred, please try again later.');
    //  reset the state
    await screen.findByText('button is idling');
  });

  it('toasts custom error message and resets the state', async () => {
    const TestHelper = () => {
      const [state, setState, Button] = useFetchButton(
        'an other error message',
      );

      useEffect(() => {
        setState({ type: 'error', error: 'some error' });
      }, []);

      return (
        <Fragment>
          {state.type === 'idle' && <p>button is idling</p>}
          <Button label="my label" />
        </Fragment>
      );
    };

    render(
      wrapInIntlProvider(
        <Fragment>
          <TestHelper />
          <Toaster />
        </Fragment>,
      ),
    );

    //  toast error
    await screen.findByText('an other error message');
    //  reset the state
    await screen.findByText('button is idling');
  });

  it('toasts computed error message and resets the state', async () => {
    const TestHelper = ({
      errorCallback,
    }: {
      errorCallback: (error: unknown) => string;
    }) => {
      const [state, setState, Button] = useFetchButton(errorCallback);

      useEffect(() => {
        setState({ type: 'error', error: 'some error' });
      }, []);

      return (
        <Fragment>
          {state.type === 'idle' && <p>button is idling</p>}
          <Button label="my label" />
        </Fragment>
      );
    };
    const callback = jest.fn().mockImplementation(() => 'some computed error');

    render(
      wrapInIntlProvider(
        <Fragment>
          <TestHelper errorCallback={callback} />
          <Toaster />
        </Fragment>,
      ),
    );

    //  toast error
    await screen.findByText('some computed error');
    expect(callback).toHaveBeenCalledWith('some error');
    //  reset the state
    await waitFor(() => {
      expect(screen.getByText('button is idling')).toBeInTheDocument();
    });
  });
});
