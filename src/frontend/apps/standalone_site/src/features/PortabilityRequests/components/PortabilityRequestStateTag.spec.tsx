import { screen } from '@testing-library/react';
import { PortabilityRequestState } from 'lib-components';
import { render } from 'lib-tests';

import { PortabilityRequestStateTag } from './PortabilityRequestStateTag';

describe('<PortabilityRequestStateTag />', () => {
  it('renders pending state', () => {
    render(
      <PortabilityRequestStateTag state={PortabilityRequestState.PENDING} />,
    );
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('renders accepted state', () => {
    render(
      <PortabilityRequestStateTag state={PortabilityRequestState.ACCEPTED} />,
    );
    expect(screen.getByText('accepted')).toBeInTheDocument();
  });

  it('renders rejected state', () => {
    render(
      <PortabilityRequestStateTag state={PortabilityRequestState.REJECTED} />,
    );
    expect(screen.getByText('rejected')).toBeInTheDocument();
  });
});
