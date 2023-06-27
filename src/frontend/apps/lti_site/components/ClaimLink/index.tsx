import React, { useEffect, useState } from 'react';
import { Anchor, Box } from 'grommet';
import {
  AppDataRessource,
  DecodedJwtLTI,
  DepositedFile,
  useAppConfig,
} from 'lib-components';
import { usePlaylistIsClaimed } from 'data/queries';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  claimResource: {
    defaultMessage:
      'Please login to manage this resource on {frontend_home_url}',
    description: 'Message displayed to the user for claiming a resource',
    id: 'components.ClaimLink',
  },
});

type ClaimLinkProps = {
  decodedJwt: DecodedJwtLTI;
};

export const ClaimLink = ({ decodedJwt }: ClaimLinkProps) => {
  const appConfig = useAppConfig();
  const intlShape = useIntl();

  const resource = (appConfig.resource ||
    appConfig.video ||
    appConfig.document) as Exclude<AppDataRessource, DepositedFile>;

  if (!resource) {
    return null;
  }

  const [showClaimLink, setShowClaimLink] = useState(
    ['videos', 'classrooms'].includes(appConfig.modelName) && !!decodedJwt.user,
  );
  const { data } = usePlaylistIsClaimed(resource.playlist.id, {
    enabled: showClaimLink,
  });

  useEffect(() => {
    if (data?.is_claimed) {
      setShowClaimLink(false);
    } else {
      return;
    }
  }, [data?.is_claimed]);

  let claimUrl = `${appConfig.frontend_home_url}/claim-resource`;
  if (showClaimLink) {
    claimUrl += `?lti_consumer_site_id=${decodedJwt.consumer_site}`;
    claimUrl += `&resource_id=${decodedJwt.resource_id}`;
    claimUrl += `&modelName=${appConfig.modelName}`;
    claimUrl += `&playlist_id=${resource.playlist.id}`;
    claimUrl += `&lti_user_id=${decodedJwt.user?.id}`;
    return (
      <Box align="center" pad="medium">
        <Anchor href={claimUrl} target="_blank" rel="noopener noreferrer">
          {intlShape.formatMessage(messages.claimResource, {
            frontend_home_url: appConfig.frontend_home_url,
          })}
        </Anchor>
      </Box>
    );
  }

  return null;
};
