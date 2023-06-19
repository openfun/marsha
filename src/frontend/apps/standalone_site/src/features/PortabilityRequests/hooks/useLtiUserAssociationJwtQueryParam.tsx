import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { useCreateLtiUserAssociation } from 'api/useLtiUserAssociations';

const messages = defineMessages({
  // Toast
  ltiUserAssociationSuccess: {
    defaultMessage:
      'Your account has been successfully linked to the LMS identifiers.',
    description:
      'Displayed message in toast when the LTI user association API call has been successfully created.',
    id: 'features.PortabilityRequests.hooks.useLtiUserAssociationJwtQueryParam.ltiUserAssociationSuccess',
  },
  ltiUserAssociationFailure: {
    defaultMessage:
      'An error occurred when linking your account to the LMS identifiers, please try to refresh the page.',
    description:
      'Displayed message in toast when the LTI user association API call has failed.',
    id: 'features.PortabilityRequests.hooks.useLtiUserAssociationJwtQueryParam.ltiUserAssociationFailure',
  },
});

export const useLtiUserAssociationJwtQueryParam = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: createLtiUserAssociation } = useCreateLtiUserAssociation();

  useEffect(() => {
    // Fetch the LTI user association token in URL if present
    const queryParams = new URLSearchParams(location.search);
    const association_jwt = queryParams.get('association_jwt');
    if (association_jwt) {
      createLtiUserAssociation(
        { association_jwt },
        {
          onSuccess: () => {
            toast.success(
              intl.formatMessage(messages.ltiUserAssociationSuccess),
            );
            queryParams.delete('association_jwt');
            navigate(
              {
                search: queryParams.toString(),
              },
              { replace: true },
            );
          },
          onError: () => {
            toast.error(intl.formatMessage(messages.ltiUserAssociationFailure));
          },
        },
      );
    }
  }, [createLtiUserAssociation, intl, location.search, navigate]);

  return null;
};
