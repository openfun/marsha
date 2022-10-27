import { useParams } from 'react-router-dom';

import { PortabilityRequests } from './PortabilityRequests';

interface PortabilityRequestsRouteParams {
  state?: string;
}

export const PortabilityRequestsRouteComponent = () => {
  const { state } = useParams<PortabilityRequestsRouteParams>();
  return <PortabilityRequests state={state} />;
};
