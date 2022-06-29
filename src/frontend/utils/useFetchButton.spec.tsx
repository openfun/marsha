import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchMediaMock from 'jest-matchmedia-mock';
import React, { Fragment, useEffect } from 'react';
import toast, { Toast, Toaster, useToaster } from 'react-hot-toast';

import { wrapInIntlProvider } from 'utils/tests/intl';

import { useFetchButton } from './useFetchButton';

let matchMedia: MatchMediaMock;

interface TestErrorHelperProps {
  errorCallback?: string | ((error: unknown) => string);
}
const TestErrorHelper = ({ errorCallback }: TestErrorHelperProps) => {
  const [state, setState, Button] = useFetchButton(errorCallback);

  useEffect(() => {
    if (state.type !== 'loading') {
      return;
    }

    setState({ type: 'error', error: 'some error' });
  }, [state]);

  return (
    <Fragment>
      {state.type === 'idle' && <p>button is idling</p>}
      <Button label="my label" />
    </Fragment>
  );
};

let getToastHook: () => any = () => {};

const ToastHack = () => {
  const toasts = useToaster();
  getToastHook = () => toasts;
  return null;
};

describe('useFetchButton', () => {
  beforeEach(() => {
    matchMedia = new MatchMediaMock();
  });
  afterEach(() => {
    matchMedia.clear();

    const toasts = getToastHook();
    if (toasts && toasts.hasOwnProperty('toasts')) {
      toasts.toasts.forEach((item: Toast) => {
        act(() => {
          toast.remove(item.id);
        });
      });
    }
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
    render(
      wrapInIntlProvider(
        <Fragment>
          <TestErrorHelper />
          <Toaster />
          <ToastHack />
        </Fragment>,
      ),
    );

    const idleText = screen.getByText('button is idling');

    userEvent.click(screen.getByRole('button', { name: 'my label' }));

    expect(idleText).not.toBeInTheDocument();

    //  toast error
    await screen.findByText('An error occurred, please try again later.');
    //  reset the state
    await screen.findByText('button is idling');
  });

  it('toasts custom error message and resets the state', async () => {
    render(
      wrapInIntlProvider(
        <Fragment>
          <TestErrorHelper errorCallback="an other error message" />
          <Toaster />
          <ToastHack />
        </Fragment>,
      ),
    );

    const idleText = screen.getByText('button is idling');

    userEvent.click(screen.getByRole('button', { name: 'my label' }));

    expect(idleText).not.toBeInTheDocument();

    //  toast error
    await screen.findByText('an other error message');
    //  reset the state
    await screen.findByText('button is idling');
  });

  it('toasts computed error message and resets the state', async () => {
    const callback = jest.fn().mockImplementation(() => 'some computed error');

    render(
      wrapInIntlProvider(
        <Fragment>
          <TestErrorHelper errorCallback={callback} />
          <Toaster />
          <ToastHack />
        </Fragment>,
      ),
    );

    const idleText = screen.getByText('button is idling');

    userEvent.click(screen.getByRole('button', { name: 'my label' }));

    expect(idleText).not.toBeInTheDocument();

    //  toast error
    await screen.findByText('some computed error');
    //  reset the state
    await screen.findByText('button is idling');
  });
});
