import { Button } from '@openfun/cunningham-react';
import { Box, Meter } from 'grommet';
import { Text, liveState } from 'lib-components';
import React, { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { usePairingVideo } from '@lib-video/api/usePairingVideo';
import { useCurrentVideo } from '@lib-video/hooks/useCurrentVideo';

const messages = defineMessages({
  pairingSecretLabel: {
    defaultMessage: 'Pair an external device',
    description:
      'Button label to request a secret for pairing an external device.',
    id: 'components.LivePairingButton.pairingSecretLabel',
  },
  pairingSecretDisplay: {
    defaultMessage: 'Pairing secret: {secret}',
    description:
      'Message displaying the secret for pairing an external device.',
    id: 'components.LivePairingButton.pairingSecretDisplay',
  },
  pairingSecretCountdownExpired: {
    defaultMessage: 'Pairing secret expired',
    description:
      'Message displayed when the secret for pairing an external device has expired.',
    id: 'components.LivePairingButton.pairingSecretCountdownExpired',
  },
});

export const LivePairingButton = () => {
  // secret expiration
  const expiration = 0;
  // reset 3 seconds after expiration
  const reset = -3;

  const video = useCurrentVideo();
  const [secret, setSecret] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const intl = useIntl();

  const usePairingVideoMutation = usePairingVideo(video.id, {
    onSuccess: (data) => {
      setSecret(data.secret);
      setExpiresIn(data.expires_in);
      setSecondsLeft(data.expires_in);
      setExpired(false);
    },
  });

  const pairVideoAction = () => {
    usePairingVideoMutation.mutate();
  };

  useEffect(() => {
    const upddateStates = () => {
      setSecondsLeft(secondsLeft - 1);

      switch (secondsLeft) {
        case expiration:
          // the secret is expired, set states to display an expiration message
          setExpired(true);
          break;
        case reset:
          // the secret expired 3 seconds ago, set states to display initial label
          setSecret('');
          break;
        default:
          break;
      }
    };

    let timeout: number | undefined;
    // don't start a timeout if secret doesn't exists
    // and reset has been done one second ago
    if (secret && secondsLeft > reset - 1) {
      timeout = window.setTimeout(upddateStates, 1000);
    }
    return () => {
      window.clearTimeout(timeout);
    };
  }, [secondsLeft, secret, reset]);

  if (!secret || expired) {
    // no secret yet, initial state
    return (
      <Button
        fullWidth
        onClick={pairVideoAction}
        disabled={video.live_state === liveState.STOPPED}
      >
        {intl.formatMessage(
          !secret
            ? messages.pairingSecretLabel
            : messages.pairingSecretCountdownExpired,
        )}
      </Button>
    );
  }

  // secret exists and is not expired yet
  return (
    <Box
      background={'var(--c--theme--colors--info-100)'}
      round="xsmall"
      pad={{ bottom: 'medium', horizontal: 'medium' }}
    >
      <Text type="p" textAlign="center" size="large" weight="medium">
        {intl.formatMessage(messages.pairingSecretDisplay, {
          secret,
        })}
      </Text>
      <Meter
        type="bar"
        color="var(--c--theme--colors--info-400)"
        background={{
          color: 'var(--c--theme--colors--info-200)',
          opacity: 'medium',
        }}
        value={(secondsLeft * 100) / expiresIn}
        alignSelf="center"
        size="full"
        thickness="xsmall"
      />
    </Box>
  );
};
