import { screen } from '@testing-library/react';
import { render } from 'lib-tests';

import ManageAPIState from './ManageAPIState';

describe('<ManageAPIState/>', () => {
  test('state without content default', () => {
    render(
      <ManageAPIState isLoading={false} isError={false} hasResult={false}>
        My state
      </ManageAPIState>,
    );
    expect(screen.queryByText(/My state/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/There is nothing to display./i),
    ).toBeInTheDocument();
  });

  test('state without content overrided with a string', () => {
    render(
      <ManageAPIState
        isLoading={false}
        isError={false}
        hasResult={false}
        nothingToDisplay="There is nothing special to display."
      >
        My state
      </ManageAPIState>,
    );
    expect(screen.queryByText(/My state/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/There is nothing special to display./i),
    ).toBeInTheDocument();
  });

  test('state without content overrided with a component', () => {
    render(
      <ManageAPIState
        isLoading={false}
        isError={false}
        hasResult={false}
        nothingToDisplay={<div>My component nothing to display.</div>}
      >
        My state
      </ManageAPIState>,
    );
    expect(screen.queryByText(/My state/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/My component nothing to display./i),
    ).toBeInTheDocument();
  });

  test('state with error', () => {
    render(
      <ManageAPIState isLoading={false} isError={true} hasResult={false}>
        My state
      </ManageAPIState>,
    );
    expect(screen.queryByText(/My state/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sorry, an error has occurred./i),
    ).toBeInTheDocument();
  });

  test('state with loading', () => {
    render(
      <ManageAPIState isLoading={true} isError={false} hasResult={false}>
        My state
      </ManageAPIState>,
    );
    expect(screen.queryByText(/My state/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('loader')).toBeInTheDocument();
  });

  test('state with success', () => {
    render(
      <ManageAPIState isLoading={false} isError={false} hasResult={true}>
        My state
      </ManageAPIState>,
    );
    expect(screen.getByText(/My state/i)).toBeInTheDocument();
  });
});
