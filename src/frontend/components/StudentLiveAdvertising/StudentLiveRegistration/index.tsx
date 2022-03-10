import { Heading, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { AdvertisingBox } from 'components/StudentLiveAdvertising/AdvertisingBox';
import { getDecodedJwt } from 'data/appData';
import { getLiveSessions } from 'data/sideEffects/getLiveSessions';
import { checkLtiToken } from 'utils/checkLtiToken';
import { getAnonymousId } from 'utils/localstorage';
import { theme } from 'utils/theme/theme';
import { Maybe } from 'utils/types';

import { RegistrationForm } from './RegistrationForm';
import { LiveSession } from 'types/tracks';

const messages = defineMessages({
  formTitle: {
    defaultMessage: 'I want to subscribe to this webinar',
    description: 'Title presented at the top of the subscription form.',
    id: 'components.SubscribScheduledVideoEmail.form.title',
  },
  registrationConsentMessage: {
    defaultMessage: 'By registering, you accept to receive an email.',
    description:
      'Consent message to inform the user you will save his email and send emails.',
    id: 'components.SubscribScheduledVideoEmail.consent',
  },
  updateSuccessfulEmail: {
    defaultMessage: 'You are successfully registered for this event.',
    description:
      'message display when the email is successfully registered for this event',
    id: 'components.SubscribScheduledVideoEmail.form.success',
  },
});

export const StudentLiveRegistration = () => {
  const intl = useIntl();
  const decodedJWT = getDecodedJwt();
  const userEmail = useMemo(() => {
    return decodedJWT.user?.email ?? undefined;
  }, [decodedJWT]);

  const [isLoading, setIsLoading] = useState(true);
  const [liveSession, setLiveSession] = useState<Maybe<LiveSession>>();

  useEffect(() => {
    let canceled = false;
    const checkRegistered = async () => {
      let anonymousId: Maybe<string>;
      if (!checkLtiToken(decodedJWT)) {
        anonymousId = getAnonymousId();
      }

      let existingLiveSessions;
      try {
        existingLiveSessions = await getLiveSessions(anonymousId);
      } catch (err) {
        return;
      }

      if (canceled) {
        return;
      }
      setIsLoading(false);
      if (existingLiveSessions.count > 0) {
        setLiveSession(existingLiveSessions.results[0]);
      }
    };

    checkRegistered();
    return () => {
      canceled = true;
    };
  }, [decodedJWT]);

  if (isLoading) {
    return <Fragment />;
  }

  return (
    <AdvertisingBox margin={{ bottom: 'large' }} pad="large">
      <Heading level={4} color={normalizeColor('blue-active', theme)}>
        {intl.formatMessage(messages.formTitle)}
      </Heading>

      {liveSession?.is_registered && (
        <Paragraph color={normalizeColor('blue-active', theme)}>
          {intl.formatMessage(messages.updateSuccessfulEmail)}
        </Paragraph>
      )}
      {!liveSession?.is_registered && (
        <RegistrationForm
          defaultEmail={userEmail}
          liveSession={liveSession}
          setRegistrationCompleted={(updatedLiveSession) =>
            setLiveSession(updatedLiveSession)
          }
        />
      )}

      <Paragraph
        color={normalizeColor('blue-active', theme)}
        margin={{ top: 'medium', bottom: 'none' }}
        textAlign="center"
      >
        {intl.formatMessage(messages.registrationConsentMessage)}
      </Paragraph>
    </AdvertisingBox>
  );
};
