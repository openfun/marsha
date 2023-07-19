import { useMutation } from '@tanstack/react-query';
import { Box, Button, Heading } from 'grommet';
import { Form } from 'lib-components';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { resetPassword } from '../api/resetPassword';
import { isError } from '../utils';

import { PrivateTextInputField } from './PrivateTextInputField';

const messages = defineMessages({
  header: {
    defaultMessage: 'My account',
    description: "Account settings page's title.",
    id: 'features.Profile.AccountSettings.header',
  },
  title: {
    defaultMessage: 'Update my password',
    description: 'Title for the bloc in settings to update the password.',
    id: 'features.Profile.AccountSettings.title',
  },
  submit: {
    defaultMessage: 'Submit',
    description:
      'Title for the submit button for the bloc in settings to update the password.',
    id: 'features.Profile.AccountSettings.submit',
  },
  currentPassword: {
    defaultMessage: 'Current password',
    description: 'Label for current password text input.',
    id: 'features.Profile.AccountSettings.currentPassword',
  },
  showCurrentPassword: {
    defaultMessage: 'Show the current password.',
    description: 'A18n label for the show current password button.',
    id: 'features.Profile.AccountSettings.showCurrentPassword',
  },
  hiddeCurrentPassword: {
    defaultMessage: 'Hidde the current password.',
    description: 'A18n label for the hidden current password button.',
    id: 'features.Profile.AccountSettings.hiddeCurrentPassword',
  },
  newPassword: {
    defaultMessage: 'New password',
    description: 'Label for new password text input.',
    id: 'features.Profile.AccountSettings.newPassword',
  },
  showNewPassword: {
    defaultMessage: 'Show new password',
    description: 'A18n label for the show new password button.',
    id: 'features.Profile.AccountSettings.showNewPassword',
  },
  hiddeNewPassword: {
    defaultMessage: 'Hidde new password',
    description: 'A18n label for the hidde new password button.',
    id: 'features.Profile.AccountSettings.hiddeNewPassword',
  },
  passwordValidation: {
    defaultMessage: 'Repeat new password',
    description: 'Label for password confirmation text input.',
    id: 'features.Profile.AccountSettings.passwordValidation',
  },
  showPasswordValidation: {
    defaultMessage: 'Show password confirmation',
    description: 'A18n label for the show password confirmation button.',
    id: 'features.Profile.AccountSettings.showPasswordValidation',
  },
  hiddePasswordValidation: {
    defaultMessage: 'Hidde password confirmation',
    description: 'A18n label for the hidde password confirmation button.',
    id: 'features.Profile.AccountSettings.hiddePasswordValidation',
  },
  defaultError: {
    defaultMessage: 'An error occurred, please try again later.',
    description:
      'Message displayed when an unknonw error occured while updating the user password.',
    id: 'features.Profile.AccountSettings.defaultError',
  },
  onSuccessMessage: {
    defaultMessage: 'Your password has been updated with success.',
    description:
      'Message displayed when updating the user password is done with success.',
    id: 'features.Profile.AccountSettings.onSuccessMessage',
  },
  onErrorMessage: {
    defaultMessage: 'An error occured, your password has not been changed.',
    description:
      'Message displayed when an error occured while updating user password.',
    id: 'features.Profile.AccountSettings.onErrorMessage',
  },
});

type FormValue = {
  currentPassword?: string;
  newPassword?: string;
  passwordValidation?: string;
};

export const AccountSettings = () => {
  const intl = useIntl();

  const { mutateAsync } = useMutation<void, unknown, FormValue>({
    mutationFn: (value) =>
      resetPassword(
        value.currentPassword,
        value.newPassword,
        value.passwordValidation,
      ),
    onSuccess: () => {
      toast.success(intl.formatMessage(messages.onSuccessMessage));
      //  reset form values
      setValues({
        currentPassword: '',
        newPassword: '',
        passwordValidation: '',
      });
    },
    onError: (backError) => {
      if (isError(backError)) {
        return;
      }

      toast.error(intl.formatMessage(messages.onErrorMessage));
    },
  });
  const [values, setValues] = useState<FormValue>({
    currentPassword: '',
    newPassword: '',
    passwordValidation: '',
  });

  return (
    <Box>
      <Heading>{intl.formatMessage(messages.header)}</Heading>
      <Box width="large" margin={{ horizontal: 'auto' }}>
        <Box
          background="white"
          pad={{ horizontal: 'medium', bottom: 'medium' }}
          elevation="even"
        >
          <Heading level={4}>{intl.formatMessage(messages.title)}</Heading>
          <Box margin={{ left: '30%' }}>
            <Form
              value={values}
              onChange={(newValues) => {
                setValues(newValues);
              }}
              onSubmit={async ({ value }) => {
                await mutateAsync(value);
              }}
              onSubmitError={(_, e) => {
                if (isError(e)) {
                  return {
                    currentPassword: e.old_password?.join(', '),
                    newPassword: e.new_password1?.join(', '),
                    passwordValidation: e.new_password2?.join(', '),
                  };
                }

                return {
                  newPassword: intl.formatMessage(messages.defaultError),
                };
              }}
            >
              <Box gap="small">
                <PrivateTextInputField
                  id="currentPassword"
                  name="currentPassword"
                  label={intl.formatMessage(messages.currentPassword)}
                  showButtonLabel={intl.formatMessage(
                    messages.showCurrentPassword,
                  )}
                  hiddeButtonLabel={intl.formatMessage(
                    messages.hiddeCurrentPassword,
                  )}
                />

                <PrivateTextInputField
                  id="newPassword"
                  name="newPassword"
                  label={intl.formatMessage(messages.newPassword)}
                  showButtonLabel={intl.formatMessage(messages.showNewPassword)}
                  hiddeButtonLabel={intl.formatMessage(
                    messages.hiddeNewPassword,
                  )}
                />

                <PrivateTextInputField
                  id="passwordValidation"
                  name="passwordValidation"
                  label={intl.formatMessage(messages.passwordValidation)}
                  showButtonLabel={intl.formatMessage(
                    messages.showPasswordValidation,
                  )}
                  hiddeButtonLabel={intl.formatMessage(
                    messages.hiddePasswordValidation,
                  )}
                />
              </Box>

              <Box>
                <Button
                  margin={{ top: 'medium' }}
                  alignSelf="end"
                  type="submit"
                  title={intl.formatMessage(messages.submit)}
                  primary
                  label={intl.formatMessage(messages.submit)}
                />
              </Box>
            </Form>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
