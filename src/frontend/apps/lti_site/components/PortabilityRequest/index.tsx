import { Button } from '@openfun/cunningham-react';
import { Clock } from 'grommet-icons';
import {
  Box,
  DecodedJwtLTI,
  Heading,
  PortabilityConfig,
  Text,
  useJwt,
} from 'lib-components';
import React from 'react';
import toast from 'react-hot-toast';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { useCreatePortabilityRequest } from '../../data/queries';

const messages = defineMessages({
  resourceRequiresPortability: {
    defaultMessage: 'The requested resource is not available for this context.',
    description:
      'Message displayed when the resource is not available for the current LTI context.',
    id: 'component.PortabilityRequest.resourceRequiresPortability',
  },
  resourcePortabilityAlreadyRequested: {
    defaultMessage:
      'A request for portability has already been made to enabled access.',
    description:
      'Message displayed when a portability request has already been made.',
    id: 'component.PortabilityRequest.resourcePortabilityAlreadyRequested',
  },
  pleaseMakeRequest: {
    defaultMessage: 'Please make a request to the playlist owner.',
    description:
      'Message displayed when a portability request is possible and not already existing.',
    id: 'component.PortabilityRequest.pleaseMakeRequest',
  },
  requestBtnLabel: {
    defaultMessage: 'Request access',
    description:
      'Label for the button to request access to a resource (portability request).',
    id: 'component.PortabilityRequest.requestBtnLabel',
  },
  portabilityRequestFailed: {
    defaultMessage: 'Portability request failed',
    description:
      'Message displayed when the creation of the portability request failed.',
    id: 'component.PortabilityRequest.portabilityRequestFailed',
  },
});

interface PortabilityRequestProps {
  portability: PortabilityConfig;
}

export const PortabilityRequest = ({
  portability,
}: PortabilityRequestProps) => {
  const intl = useIntl();
  const getDecodedJwt = useJwt((state) => state.getDecodedJwt);
  const [portabilityRequested, setPortabilityRequested] = React.useState(
    portability.portability_request_exists,
  );

  const useCreatePortabilityRequestMutation = useCreatePortabilityRequest({
    onSuccess: () => {
      // Then open frontend to the "pending requests" view
      const newWindow = window.open(
        portability.redirect_to,
        '_blank',
        'noopener,noreferrer',
      );
      if (newWindow) {
        newWindow.opener = null;
      }
      setPortabilityRequested(true);
    },
    onError: () => {
      toast.error(intl.formatMessage(messages.portabilityRequestFailed));
    },
  });

  const onRequestBtnClick = () => {
    const decodedJwt = getDecodedJwt() as DecodedJwtLTI;

    if (
      !decodedJwt.playlist_id ||
      !decodedJwt.consumer_site ||
      !decodedJwt.user?.id
    ) {
      toast.error(intl.formatMessage(messages.portabilityRequestFailed));
      return;
    }

    useCreatePortabilityRequestMutation.mutate({
      for_playlist: portability.for_playlist_id,
      from_playlist: decodedJwt.playlist_id,
      from_lti_consumer_site: decodedJwt.consumer_site,
      from_lti_user_id: decodedJwt.user.id,
    });
  };

  return (
    <Box pad="medium" align="center">
      <Heading level={5}>
        <FormattedMessage {...messages.resourceRequiresPortability} />
      </Heading>
      {portabilityRequested ? (
        <React.Fragment>
          <Text type="p" className="mt-s">
            <FormattedMessage
              {...messages.resourcePortabilityAlreadyRequested}
            />
          </Text>
          <Clock size="large" />
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Text type="p" className="mt-s">
            <FormattedMessage {...messages.pleaseMakeRequest} />
          </Text>
          <Button onClick={onRequestBtnClick}>
            {intl.formatMessage(messages.requestBtnLabel)}
          </Button>
        </React.Fragment>
      )}
    </Box>
  );
};
