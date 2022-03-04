import { Button, Grommet, Paragraph, TextInput } from 'grommet';
import { deepMerge, normalizeColor } from 'grommet/utils';
import React, { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { Form, FormField } from 'components/Form';
import { getDecodedJwt } from 'data/appData';
import { createLiveSession } from 'data/sideEffects/createLiveSession';
import { checkLtiToken } from 'utils/checkLtiToken';
import { getAnonymousId } from 'utils/localstorage';
import { theme } from 'utils/theme/theme';
import { Maybe } from 'utils/types';

const formTheme = deepMerge(theme, {
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
});

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
});

interface RegistrationFormProps {
  defaultEmail?: string;
  setRegistrationCompleted: () => void;
}

export const RegistrationForm = ({
  defaultEmail,
  setRegistrationCompleted,
}: RegistrationFormProps) => {
  const trimedEmail = defaultEmail && defaultEmail.trim();

  const intl = useIntl();
  const [values, setValues] = useState({ email: trimedEmail });
  const [ltiUserError, setLtiUserError] = useState<Maybe<string>>(undefined);
  const isLtiToken = useMemo(() => {
    return checkLtiToken(getDecodedJwt());
  }, [getDecodedJwt]);

  const displayEmailInput = !(
    isLtiToken &&
    values.email &&
    values.email !== ''
  );

  return (
    <Grommet theme={formTheme}>
      <Form
        value={values}
        onChange={setValues}
        onSubmit={async ({ value }) => {
          if (!value.email) {
            //  submit without email should not be possible since validation should fail
            return;
          }

          let anonymousId: Maybe<string>;
          if (!isLtiToken) {
            anonymousId = getAnonymousId();
          }
          await createLiveSession(value.email, anonymousId);
          setLtiUserError(undefined);
          setRegistrationCompleted();
        }}
        onSubmitError={(value, error) => {
          if (!value.email) {
            //  submit without email should not be possible since validation should fail
            return {};
          }

          if (!displayEmailInput) {
            setLtiUserError(
              intl.formatMessage(messages.updateMailDefaultError, value),
            );
            return {};
          }

          let errorMessage;
          if (error.email && error.email[0].indexOf('already registered') > 0) {
            errorMessage = intl.formatMessage(
              messages.updateMailAlreadyExistingError,
              value,
            );
          } else if (error.email) {
            errorMessage = intl.formatMessage(
              messages.updateMailNotValidError,
              value,
            );
          } else {
            errorMessage = intl.formatMessage(
              messages.updateMailDefaultError,
              value,
            );
          }

          return { email: errorMessage };
        }}
      >
        {displayEmailInput && (
          <FormField
            htmlFor="text-input-id"
            label={intl.formatMessage(messages.emailInputLabel)}
            name="email"
            validate={[
              {
                regexp:
                  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                message: intl.formatMessage(
                  messages.emailFormatValidationError,
                ),
                status: 'error',
              },
            ]}
          >
            <TextInput
              id="text-input-id"
              name="email"
              placeholder="email"
              type="TextInput"
            />
          </FormField>
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
      </Form>
    </Grommet>
  );
};
