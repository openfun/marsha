import { Button, Form, FormField, Grommet, ResponsiveContext } from 'grommet';
import { deepMerge, normalizeColor } from 'grommet/utils';
import React, { CSSProperties, useContext, useRef } from 'react';
import toast from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { getDecodedJwt } from 'data/appData';
import { createLiveRegistration } from 'data/sideEffects/createLiveRegistration';
import { checkLtiToken } from 'utils/checkLtiToken';
import { getAnonymousId } from 'utils/localstorage';
import { theme } from 'utils/theme/theme';
import { Maybe } from 'utils/types';

import { RegistrationEmailField } from './RegistrationEmailField';

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

interface FormValues {
  email: string | undefined;
}

interface RegistrationFormProps {
  values: FormValues;
  setValues: (newValues: FormValues) => void;
  setRegistrationCompleted: () => void;
}

export const RegistrationForm = ({
  values,
  setValues,
  setRegistrationCompleted,
}: RegistrationFormProps) => {
  const intl = useIntl();
  const size = useContext(ResponsiveContext);
  const isSubmitOngoing = useRef(false);

  const onSubmit = async (email: string) => {
    let anonymousId: Maybe<string>;
    if (!checkLtiToken(getDecodedJwt())) {
      anonymousId = getAnonymousId();
    }
    try {
      await createLiveRegistration(email, anonymousId);
      setRegistrationCompleted();
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

  let inputWidth: string;
  let submitButtonStyle: CSSProperties;
  if (size === 'small') {
    inputWidth = '100%';
    submitButtonStyle = { width: '100%', marginTop: '16px' };
  } else {
    inputWidth = '50%';
    submitButtonStyle = { minWidth: '40%' };
  }
  const SubmitButton = () => (
    <Button
      type="submit"
      primary
      label={intl.formatMessage(messages.formSubmitTitle)}
      style={submitButtonStyle}
    />
  );

  return (
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
            message: intl.formatMessage(messages.emailFormatValidationError),
            status: 'error',
          }}
        >
          <RegistrationEmailField
            inputLabel={intl.formatMessage(messages.emailInputLabel)}
            id="text-input-id"
            inputWidth={inputWidth}
            name="email"
          >
            {size !== 'small' && <SubmitButton />}
          </RegistrationEmailField>
        </FormField>

        {size === 'small' && <SubmitButton />}
      </Form>
    </Grommet>
  );
};
