import { useParams } from 'react-router-dom';

import { PortabilityRequests } from './PortabilityRequests';

export const PortabilityRequestsRouteComponent = () => {
  const { state } = useParams();
  return <PortabilityRequests state={state} />;
};
