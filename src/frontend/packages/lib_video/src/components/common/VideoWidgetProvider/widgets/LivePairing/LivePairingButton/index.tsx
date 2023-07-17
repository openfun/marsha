import { Meter, Text } from 'grommet';
import { DashboardButton, liveState } from 'lib-components';
import React, { useEffect, useState } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

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
  const [buttonColor, setButtonColor] = useState('brand');
  const [secret, setSecret] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expired, setExpired] = useState(false);

  const usePairingVideoMutation = usePairingVideo(video.id, {
    onSuccess: (data) => {
      setSecret(data.secret);
      setExpiresIn(data.expires_in);
      setSecondsLeft(data.expires_in);
      setExpired(false);
      setButtonColor('status-ok');
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
          setButtonColor('status-warning');
          break;
        case reset:
          // the secret expired 3 seconds ago, set states to display initial label
          setSecret('');
          setButtonColor('brand');
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

  let content: JSX.Element;

  if (!secret) {
    // no secret yet, initial state
    content = (
      <Text alignSelf="center">
        <FormattedMessage {...messages.pairingSecretLabel} />
      </Text>
    );
  } else {
    if (!expired) {
      // secret exists and is not expired yet
      content = (
        <React.Fragment>
          <Text alignSelf="center" size="large">
            <FormattedMessage
              {...messages.pairingSecretDisplay}
              values={{ secret }}
            />
          </Text>
          <Meter
            type="bar"
            color="light-1"
            background={{ color: 'light-1', opacity: 'medium' }}
            value={(secondsLeft * 100) / expiresIn}
            alignSelf="center"
            size="full"
            thickness="xsmall"
            margin={{ top: 'small' }}
          />
        </React.Fragment>
      );
    } else {
      // secret has expired
      content = (
        <Text alignSelf="center">
          <FormattedMessage {...messages.pairingSecretCountdownExpired} />
        </Text>
      );
    }
  }

  return (
    <DashboardButton
      primary
      color={buttonColor}
      onClick={pairVideoAction}
      label={content}
      style={{ margin: 0, maxWidth: '100%' }}
      disabled={video.live_state === liveState.STOPPED}
    />
  );
};
