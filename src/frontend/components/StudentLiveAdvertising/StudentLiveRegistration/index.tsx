import {
  Box,
  Button,
  Form,
  FormField,
  Grommet,
  Heading,
  Paragraph,
} from 'grommet';
import { deepMerge, normalizeColor } from 'grommet/utils';
import React, {
  Fragment,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';
import { v4 as uuidv4 } from 'uuid';

import { AdvertisingBox } from 'components/StudentLiveAdvertising/AdvertisingBox';
import { getDecodedJwt } from 'data/appData';
import { fetchList } from 'data/queries/fetchList';
import { createLiveRegistration } from 'data/sideEffects/createLiveRegistration';
import { DecodedJwt } from 'types/jwt';
import { theme } from 'utils/theme/theme';

import { RegistrationEmailField } from './RegistrationEmailField';

const messages = defineMessages({
  updateMailAlreadyExistingError: {
    defaultMessage:
      'Impossible to register, {email} is already registered for this event with another account.',
    description:
      'Error message to warn the user that his email registration did not work because this email is already registered.',
    id: 'components.SubscribScheduledVideoEmail.form.email.existing.error',
  },
  updateMailNotValidError: {
    defaultMessage: 'Impossible to register, {email} is not valid.',
    description:
      'Error message to warn the user that his email registration did not work because this email is not valid.',
    id: 'components.SubscribScheduledVideoEmail.form.email.invalid.error',
  },
  updateMailDefaultError: {
    defaultMessage:
      'Impossible to register your email {email} for this event. Make sure your email is valid otherwise, please try again later or contact us.',
    description:
      'Error message to warn the user that his email registration did not work. Ask user to check his Email address otherwise to contact us or to try later.',
    id: 'components.SubscribScheduledVideoEmail.form.email.default.error',
  },
  formTitle: {
    defaultMessage: 'I want to subscribe to this webinar',
    description: 'Title presented at the top of the subscription form.',
    id: 'components.SubscribScheduledVideoEmail.form.title',
  },
  emailFormatValidationError: {
    defaultMessage: 'You have to submit a valid email to register.',
    description:
      'Error message if input value does not conform to email regex.',
    id: 'components.SubscribScheduledVideoEmail.form.email.validation.error',
  },
  emailInputLabel: {
    defaultMessage: 'Email address',
    description: 'Label for email input in form.',
    id: 'components.SubscribScheduledVideoEmail.form.email.label',
  },
  formSubmitTitle: {
    defaultMessage: 'Register',
    description: 'Title for the submit button in registration form',
    id: 'components.SubscribScheduledVideoEmail.form.submit.title',
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

const formTheme = deepMerge(theme, {
  global: {
    input: {
      padding: '4px',
    },
  },
  formField: {
    error: {
      border: {
        color: normalizeColor('red-active', theme),
      },
      color: 'white',
      container: {
        background: normalizeColor('red-active', theme),
        margin: {
          top: 'small',
        },
        pad: 'small',
      },
    },
    border: {
      color: normalizeColor('blue-focus', theme),
    },
    margin: '0',
  },
  button: {
    primary: {
      font: {
        weight: 600,
      },
    },
  },
  text: {
    medium: {
      size: '20px',
    },
  },
});

const checkLtiToken = (jwt: DecodedJwt) => {
  return (
    jwt.context_id && jwt.consumer_site && jwt.user !== undefined && jwt.user.id
  );
};

export const StudentLiveRegistration = () => {
  const intl = useIntl();
  const decodedJWT = getDecodedJwt();
  const userEmail = useMemo(() => {
    return decodedJWT.user?.email ?? undefined;
  }, [decodedJWT]);
  const [values, setValues] = useState({ email: userEmail });
  const [isLoading, setIsLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const isSubmitOngoing = useRef(false);

  const onSubmit = async (email: string) => {
    try {
      const anonymousId = uuidv4();
      await createLiveRegistration(anonymousId, email);
      setRegistered(true);
    } catch (error: any) {
      let errorMessage;
      if (error.email && error.email[0].indexOf('already registered') > 0) {
        errorMessage = intl.formatMessage(
          messages.updateMailAlreadyExistingError,
          {
            email,
          },
        );
      } else if (error.email) {
        errorMessage = intl.formatMessage(messages.updateMailNotValidError, {
          email,
        });
      } else {
        errorMessage = intl.formatMessage(messages.updateMailDefaultError, {
          email,
        });
      }
      toast.error(errorMessage);
    }
  };

  useLayoutEffect(() => {
    let canceled = false;
    const checkRegistered = async () => {
      if (!checkLtiToken(decodedJWT)) {
        setIsLoading(false);
        return;
      }

      let registrations;
      try {
        registrations = await fetchList({
          queryKey: ['liveregistrations'],
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

      <Box margin={{ top: 'medium', bottom: 'medium' }}>
        {registered ? (
          <Paragraph color={normalizeColor('blue-active', theme)}>
            {intl.formatMessage(messages.updateSuccessfulEmail)}
          </Paragraph>
        ) : (
          <Grommet theme={formTheme}>
            <Form
              value={values}
              onChange={(formValues) => setValues(formValues)}
              onSubmit={async ({ value }) => {
                if (isSubmitOngoing.current) {
                  //  a submit is already in progress
                  return;
                }
                if (!value.email) {
                  //  submit without email should not be possible since validation should fail
                  return;
                }

                isSubmitOngoing.current = true;
                await onSubmit(value.email);
                isSubmitOngoing.current = false;
              }}
            >
              <FormField
                name="email"
                htmlFor="text-input-id"
                contentProps={{ pad: 'none', style: { border: 'none' } }}
                pad={false}
                validate={{
                  regexp:
                    /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                  message: intl.formatMessage(
                    messages.emailFormatValidationError,
                  ),
                  status: 'error',
                }}
              >
                <RegistrationEmailField
                  inputLabel={intl.formatMessage(messages.emailInputLabel)}
                  id="text-input-id"
                  inputWidth="50%"
                  name="email"
                >
                  <Button
                    type="submit"
                    primary
                    label={intl.formatMessage(messages.formSubmitTitle)}
                    style={{ minWidth: '40%' }}
                  />
                </RegistrationEmailField>
              </FormField>
            </Form>
          </Grommet>
        )}
      </Box>

      <Box>
        <Paragraph color={normalizeColor('blue-active', theme)}>
          {intl.formatMessage(messages.registrationConsentMessage)}
        </Paragraph>
      </Box>
    </AdvertisingBox>
  );
};
