import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Maybe } from 'lib-common';
import { render } from 'lib-tests';

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
    render(<PortabilityRequestsRouteComponent />, {
      routerOptions: {
        componentPath: '/portability-requests/*',
        history: ['/portability-requests/'],
      },
    });

    expect(screen.getByText('no state')).toBeInTheDocument();
  });

  it('calls PortabilityRequests with state from route', () => {
    render(<PortabilityRequestsRouteComponent />, {
      routerOptions: {
        componentPath: '/portability-requests/:state',
        history: ['/portability-requests/accepted/'],
      },
    });

    expect(screen.getByText('accepted')).toBeInTheDocument();
  });
});
