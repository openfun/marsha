import { AnonymousUser, useCurrentUser } from 'lib-components';
import { useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { useCreateLtiUserAssociation } from 'api/useLtiUserAssociations';

import { useClaimResource } from '../api/useClaimResource';

const messages = defineMessages({
  title: {
    defaultMessage: 'Claiming resource…',
    description: 'Title of the claim resource page',
    id: 'features.ClaimResource.components.ClaimResource.title',
  },
  ltiUserAssociationSuccess: {
    defaultMessage:
      'Your account has been successfully linked to the LMS identifiers.',
    description:
      'Displayed message in toast when the LTI user association API call has been successfully created.',
    id: 'features.ClaimResource.components.ClaimResource.ltiUserAssociationSuccess',
  },
  ltiUserAssociationFailure: {
    defaultMessage:
      'An error occurred when linking your account to the LMS identifiers, please try to refresh the page.',
    description:
      'Displayed message in toast when the LTI user association API call has failed.',
    id: 'features.ClaimResource.components.ClaimResource.ltiUserAssociationFailure',
  },
  resourceClaimedSuccess: {
    defaultMessage: 'Resource claimed with success.',
    description:
      'Displayed message in toast when the resource has been claimed with success.',
    id: 'features.ClaimResource.components.ClaimResource.resourceClaimedSuccess',
  },
  resourceClaimedFailure: {
    defaultMessage: 'An error occurred when claiming the resource.',
    description:
      'Displayed message in toast when the resource claim API call has failed.',
    id: 'features.ClaimResource.components.ClaimResource.resourceClaimedFailure',
  },
});

export const ClaimResource = () => {
  const intl = useIntl();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const lti_consumer_site_id = params.get('lti_consumer_site_id');
  const lti_user_id = params.get('lti_user_id');
  const modelName = params.get('modelName');
  const resource_id = params.get('resource_id');

  const { mutate: createLtiUserAssociation } = useCreateLtiUserAssociation({
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.ltiUserAssociationSuccess));
    },
    onError: (error) => {
      if (error.status !== 409) {
        // 409 is the status code when the association already exists
        toast.error(intl.formatMessage(messages.ltiUserAssociationFailure));
      }
    },
    onSettled: () => {
      claimResource.mutate(undefined, {
        onSuccess: () => {
          if (modelName && resource_id) {
            let modelNamePath = modelName;
            if (modelName === 'classrooms') {
              modelNamePath = 'classroom';
            }
            navigate(`/my-contents/${modelNamePath}/${resource_id}`);
          }
        },
      });
    },
  });
  const { currentUser } = useCurrentUser();
  const claimResource = useClaimResource(params.get('playlist_id') || '', {
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.resourceClaimedSuccess));
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.resourceClaimedFailure));
    },
  });
  const navigate = useNavigate();

  const idUser =
    currentUser && currentUser !== AnonymousUser.ANONYMOUS
      ? currentUser.id
      : undefined;

  useEffect(() => {
    if (lti_consumer_site_id && lti_user_id && idUser) {
      createLtiUserAssociation({
        lti_consumer_site_id: lti_consumer_site_id,
        lti_user_id: lti_user_id,
      });
    }
  }, [createLtiUserAssociation, idUser, lti_consumer_site_id, lti_user_id]);

  return <h1>{intl.formatMessage(messages.title)}</h1>;
};
