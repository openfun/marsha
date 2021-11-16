import {
  Box,
  Button,
  Form,
  FormField,
  Notification,
  StatusType,
  TextInput,
} from 'grommet';
import React, { Fragment, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { createLiveRegistration } from '../../data/sideEffects/createLiveRegistration';
import { Maybe } from '../../utils/types';
import { Nullable } from '../../utils/types';

const messages = defineMessages({
  labelRegisterSubmitButton: {
    defaultMessage: 'Register',
    description: 'Label of the input to register to the event',
    id: 'components.SubscribScheduledVideoEmail.form.labelRegisterSubmitButton',
  },
  updateEmail: {
    defaultMessage: 'Type your email to subscribe',
    description:
      'Label of the input field to add an email to subscribe to the event',
    id: 'components.SubscribScheduledVideoEmail.form.email',
  },
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
      'Impossible to register your email {email} for this event. Are you sure, your email is valid otherwise, please try again later or contact us.',
    description:
      'Error message to warn the user that his email registration did not work. Ask user to check his email adress otherwise to contact us or to try later.',
    id: 'components.SubscribScheduledVideoEmail.form.email.default.error',
  },
  updateSuccessfulEmail: {
    defaultMessage: 'Email {email} successfully registered for this event',
    description:
      'message display when the email is successfully registered for this event',
    id: 'components.SubscribScheduledVideoEmail.form.success',
  },
});

interface SubscribeScheduledVideoEmailFormProps {
  emailToken?: Nullable<string>;
}

export const SubscribeScheduledVideoEmailForm = ({
  emailToken,
}: SubscribeScheduledVideoEmailFormProps) => {
  const [email, setEmail] = useState(!emailToken ? '' : emailToken);
  const [error, setError] = useState<Maybe<string>>(undefined);
  const [udpated, setUpdated] = useState(false);

  const intl = useIntl();
  const subscribeEmail = async () => {
    try {
      await createLiveRegistration(email!);
      setError(undefined);
      setUpdated(true);
    } catch (error: any) {
      setUpdated(false);
      if (error.email) {
        if (error.email[0].indexOf('already registered') > 0) {
          setError(
            intl.formatMessage(messages.updateMailAlreadyExistingError, {
              email,
            }),
          );
        } else {
          setError(
            intl.formatMessage(messages.updateMailNotValidError, { email }),
          );
        }
      } else {
        setError(
          intl.formatMessage(messages.updateMailDefaultError, { email }),
        );
      }
    }
  };

  return (
    <Fragment>
      {!udpated && (
        <Form onSubmit={subscribeEmail}>
          {!emailToken ? (
            <Box>
              <FormField
                label={intl.formatMessage(messages.updateEmail)}
                htmlFor="email"
                error={error}
                component={TextInput}
              >
                <TextInput
                  id="email"
                  maxLength={255}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  required={true}
                  size="medium"
                  value={email!}
                  type="text"
                />
              </FormField>
            </Box>
          ) : (
            <TextInput
              id="email"
              required={true}
              value={email!}
              type="hidden"
            />
          )}
          <Button
            type="submit"
            primary
            label={intl.formatMessage(messages.labelRegisterSubmitButton)}
          />
        </Form>
      )}

      {udpated && (
        <Notification
          status={'normal' as StatusType}
          title={intl.formatMessage(messages.updateSuccessfulEmail, { email })}
        />
      )}
    </Fragment>
  );
};
