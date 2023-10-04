import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib-tests';
import { Fragment, useEffect } from 'react';

import { useFetchButton } from './useFetchButton';

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
  }, [state, setState]);

  return (
    <Fragment>
      {state.type === 'idle' && <p>button is idling</p>}
      <Button label="my label" />
    </Fragment>
  );
};

describe('useFetchButton', () => {
  it('renders the button', () => {
    const TestHelper = () => {
      const [_state, _setState, Button] = useFetchButton();

      return <Button label="my label" />;
    };

    render(<TestHelper />);

    expect(
      screen.getByRole('button', { name: 'my label' }),
    ).toBeInTheDocument();
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

    render(<TestHelper />);

    await userEvent.click(screen.getByRole('button', { name: 'my label' }));

    await screen.findByText('button is loading');
    expect(screen.getByRole('button', { name: /my label/ })).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('toasts default error message and resets the state', async () => {
    render(<TestErrorHelper />);

    const idleText = screen.getByText('button is idling');

    await userEvent.click(screen.getByRole('button', { name: 'my label' }));

    expect(idleText).not.toBeInTheDocument();

    //  toast error
    await screen.findByText('An error occurred, please try again later.');
    //  reset the state
    await screen.findByText('button is idling');
  });

  it('toasts custom error message and resets the state', async () => {
    render(<TestErrorHelper errorCallback="an other error message" />);

    const idleText = screen.getByText('button is idling');

    await userEvent.click(screen.getByRole('button', { name: 'my label' }));

    expect(idleText).not.toBeInTheDocument();

    //  toast error
    await screen.findByText('an other error message');
    //  reset the state
    await screen.findByText('button is idling');
  });

  it('toasts computed error message and resets the state', async () => {
    const callback = jest.fn().mockImplementation(() => 'some computed error');

    render(<TestErrorHelper errorCallback={callback} />);

    const idleText = screen.getByText('button is idling');

    await userEvent.click(screen.getByRole('button', { name: 'my label' }));

    expect(idleText).not.toBeInTheDocument();

    //  toast error
    await screen.findByText('some computed error');
    //  reset the state
    await screen.findByText('button is idling');
  });
});
