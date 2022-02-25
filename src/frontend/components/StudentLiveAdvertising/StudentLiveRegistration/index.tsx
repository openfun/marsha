import { Heading, Paragraph } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { AdvertisingBox } from 'components/StudentLiveAdvertising/AdvertisingBox';
import { getDecodedJwt } from 'data/appData';
import { fetchList } from 'data/queries/fetchList';
import { checkLtiToken } from 'utils/checkLtiToken';
import { getAnonymousId } from 'utils/localstorage';
import { theme } from 'utils/theme/theme';
import { Maybe } from 'utils/types';

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
  const decodedJWT = getDecodedJwt();
  const userEmail = useMemo(() => {
    return decodedJWT.user?.email ?? undefined;
  }, [decodedJWT]);

  const [isLoading, setIsLoading] = useState(true);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    let canceled = false;
    const checkRegistered = async () => {
      let queryString: Maybe<{ anonymous_id: string }>;
      if (!checkLtiToken(decodedJWT)) {
        queryString = { anonymous_id: getAnonymousId() };
      }

      let registrations;
      try {
        registrations = await fetchList({
          queryKey: ['liveregistrations', queryString],
          meta: {},
        });
      } catch (err) {
        return;
      }

      if (canceled) {
        return;
      }
      setIsLoading(false);
      setRegistered(registrations.count > 0);
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

      {registered && (
        <Paragraph color={normalizeColor('blue-active', theme)}>
          {intl.formatMessage(messages.updateSuccessfulEmail)}
        </Paragraph>
      )}
      {!registered && (
        <RegistrationForm
          defaultEmail={userEmail}
          setRegistrationCompleted={() => setRegistered(true)}
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
