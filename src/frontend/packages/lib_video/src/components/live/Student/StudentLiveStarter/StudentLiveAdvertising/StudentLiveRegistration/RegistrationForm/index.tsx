import { Input } from '@openfun/cunningham-react';
import { Button, Paragraph, ThemeContext } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { Maybe, theme } from 'lib-common';
import { LiveSession, checkToken, decodeJwt, useJwt } from 'lib-components';
import { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { createLiveSession } from '@lib-video/api/createLiveSession';
import { updateLiveSession } from '@lib-video/api/updateLiveSession';
import { useCurrentLive } from '@lib-video/hooks/useCurrentVideo';
import { getAnonymousId } from '@lib-video/utils/localstorage';

const formTheme = {
  global: {
    input: {
      padding: '4px',
    },
  },
  formField: {
    border: {
      color: 'blue-chat',
      position: 'outer',
      side: 'all',
      style: 'solid',
      size: 'small',
    },
    content: {
      margin: {
        left: '20px',
        right: 'none',
        vertical: 'xsmall',
      },
    },
    disabled: {
      border: {
        color: 'bg-lightgrey',
      },
    },
    error: {
      border: {
        color: 'red-active',
      },
      color: 'white',
      container: {
        background: normalizeColor('red-active', theme),
        margin: {
          top: 'none',
          bottom: 'xsmall',
          horizontal: 'xsmall',
        },
        pad: {
          horizontal: 'small',
          vertical: 'xsmall',
        },
        round: 'xsmall',
      },
      size: 'medium',
    },
    label: {
      color: normalizeColor('bg-grey', theme),
      margin: {
        bottom: 'none',
        left: '20px',
        right: 'none',
        top: '2px',
      },
      size: 'xsmall',
    },
    margin: '0',
    round: 'xsmall',
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
};

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
});

const isBackendFormError = (error: unknown): error is { email: string[] } => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const casted = error as { email?: unknown };
  if (!casted.email || !Array.isArray(casted.email)) {
    return false;
  }

  let match = true;
  casted.email.forEach((value) => {
    if (!value || typeof value !== 'string') {
      match = false;
    }
  });
  return match;
};

const isValidationFormError = (error: unknown): error is { email: string } => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const casted = error as { email?: unknown };
  if (!casted.email || typeof casted.email !== 'string') {
    return false;
  }

  return true;
};

interface RegistrationFormProps {
  defaultEmail?: string;
  liveSession: Maybe<LiveSession>;
  setRegistrationCompleted: (liveSession: LiveSession) => void;
}

export const RegistrationForm = ({
  defaultEmail = '',
  liveSession,
  setRegistrationCompleted,
}: RegistrationFormProps) => {
  const trimedEmail = defaultEmail && defaultEmail.trim();

  const intl = useIntl();
  const jwt = useJwt((state) => state.getJwt());
  const live = useCurrentLive();
  const [values, setValues] = useState({ email: trimedEmail });
  const [ltiUserError, setLtiUserError] = useState<Maybe<string>>(undefined);
  const isValidToken = useMemo(() => {
    return checkToken(decodeJwt(jwt));
  }, [jwt]);

  const displayEmailInput = !(
    isValidToken &&
    trimedEmail &&
    trimedEmail !== ''
  );

  return (
    <ThemeContext.Extend value={formTheme}>
      <form
        onChange={(e) => {
          const { name, value } = e.target as HTMLInputElement;
          setValues((_value) => ({ ..._value, [name]: value }));
        }}
        onSubmit={(e) => {
          e.preventDefault();

          if (!values.email) {
            //  submit without email should not be possible since validation should fail
            return;
          }

          const submit = async () => {
            let anonymousId: Maybe<string>;
            if (!isValidToken) {
              anonymousId = getAnonymousId();
            }
            let updatedLiveSession: LiveSession;

            try {
              if (!liveSession) {
                updatedLiveSession = await createLiveSession(
                  live.id,
                  values.email,
                  intl.locale,
                  anonymousId,
                );
              } else {
                updatedLiveSession = await updateLiveSession(
                  liveSession,
                  intl.locale,
                  values.email,
                  true,
                  anonymousId,
                );
              }

              setLtiUserError(undefined);
              setRegistrationCompleted(updatedLiveSession);
            } catch (error) {
              if (!displayEmailInput) {
                setLtiUserError(
                  intl.formatMessage(messages.updateMailDefaultError, values),
                );
                return;
              }

              let errorMessage;
              if (
                isBackendFormError(error) &&
                error.email.length > 0 &&
                error.email[0].indexOf('already registered') > 0
              ) {
                errorMessage = intl.formatMessage(
                  messages.updateMailAlreadyExistingError,
                  values,
                );
              } else if (isValidationFormError(error)) {
                errorMessage = intl.formatMessage(
                  messages.updateMailNotValidError,
                  values,
                );
              } else {
                errorMessage = intl.formatMessage(
                  messages.updateMailDefaultError,
                  values,
                );
              }

              setLtiUserError(errorMessage);
            }
          };

          submit();
        }}
      >
        {displayEmailInput && (
          <Input
            aria-label={intl.formatMessage(messages.emailInputLabel)}
            fullWidth
            label={intl.formatMessage(messages.emailInputLabel)}
            name="email"
            type="email"
            required
            defaultValue={values.email}
          />
        )}

        <Button
          fill="horizontal"
          label={intl.formatMessage(messages.formSubmitTitle)}
          margin={{ top: 'medium' }}
          primary
          type="submit"
        />

        {ltiUserError && (
          <Paragraph color="red-active" fill margin="small" textAlign="center">
            {ltiUserError}
          </Paragraph>
        )}
      </form>
    </ThemeContext.Extend>
  );
};
