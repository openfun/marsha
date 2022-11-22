import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Maybe } from 'lib-common';
import { render } from 'lib-tests';
import { Route } from 'react-router-dom';

import { PortabilityRequestsRouteComponent } from './PortabilityRequestsRouteComponent';

jest.mock('./PortabilityRequests', () => ({
  __esModule: true,
  PortabilityRequests: ({ state }: { state?: Maybe<string> }) => (
    <div>{state || 'no state'}</div>
  ),
}));

describe('<PortabilityRequestsRouteComponent />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('calls PortabilityRequests when no parameters', () => {
    render(
      <Route path="/portability-requests/:state?" exact>
        <PortabilityRequestsRouteComponent />
      </Route>,
      {
        routerOptions: { history: ['/portability-requests/'] },
      },
    );

    expect(screen.getByText('no state')).toBeInTheDocument();
  });

  it('calls PortabilityRequests with state from route', () => {
    render(
      <Route path="/portability-requests/:state?" exact>
        <PortabilityRequestsRouteComponent />
      </Route>,
      {
        routerOptions: { history: ['/portability-requests/accepted/'] },
      },
    );

    expect(screen.getByText('accepted')).toBeInTheDocument();
  });
});
