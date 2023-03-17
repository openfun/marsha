import { Heading, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Maybe, theme } from 'lib-common';
import {
  AnonymousUser,
  decodeJwt,
  useCurrentUser,
  useJwt,
  checkToken,
} from 'lib-components';
import React, { Fragment, useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useLiveSessionsQuery } from '@lib-video/api/useLiveSessions';
import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import { useLiveSession } from '@lib-video/hooks/useLiveSession';
import { getAnonymousId } from '@lib-video/utils/localstorage';

import { AdvertisingBox } from '../AdvertisingBox';

import { RegistrationForm } from './RegistrationForm';

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
  const jwt = useJwt((state) => state.getJwt());
  const live = useCurrentLive();
  const user = useCurrentUser((state) => state.currentUser);

  const userEmail = useMemo(() => {
    return (user !== AnonymousUser.ANONYMOUS && user?.email) || undefined;
  }, [user]);

  const anonymousId = useMemo(() => {
    let anonId: Maybe<string>;
    if (!checkToken(decodeJwt(jwt))) {
      anonId = getAnonymousId();
    }

    return anonId;
  }, [jwt]);

  const { liveSession, setLiveSession } = useLiveSession();
  const { isError, isLoading } = useLiveSessionsQuery(
    live.id,
    { anonymous_id: anonymousId },
    {
      onSuccess: (data) => {
        if (data.count > 0) {
          setLiveSession(data.results[0]);
        }
      },
      refetchInterval: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      staleTime: 1000,
    },
  );

  if (isLoading || isError) {
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
