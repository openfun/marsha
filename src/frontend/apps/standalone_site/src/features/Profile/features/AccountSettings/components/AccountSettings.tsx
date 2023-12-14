import { Button } from '@openfun/cunningham-react';
import { useMutation } from '@tanstack/react-query';
import { Box, FetchResponseError, Heading } from 'lib-components';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { defineMessages, useIntl } from 'react-intl';

import { WhiteCard } from 'components/Cards';
import { PrivateTextInputField } from 'components/Text/PrivateTextInputField';

import { ResetPasswordError, resetPassword } from '../api/resetPassword';
import { isError } from '../utils';

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
  revealCurrentPassword: {
    defaultMessage: 'Reveal the current password.',
    description: 'A18n label for the revealed current password button.',
    id: 'features.Profile.AccountSettings.revealCurrentPassword',
  },
  hideCurrentPassword: {
    defaultMessage: 'Hide the current password.',
    description: 'A18n label for the hidden current password button.',
    id: 'features.Profile.AccountSettings.hideCurrentPassword',
  },
  newPassword: {
    defaultMessage: 'New password',
    description: 'Label for new password text input.',
    id: 'features.Profile.AccountSettings.newPassword',
  },
  revealNewPassword: {
    defaultMessage: 'Reveal new password',
    description: 'A18n label for the revealed new password button.',
    id: 'features.Profile.AccountSettings.revealNewPassword',
  },
  hideNewPassword: {
    defaultMessage: 'Hide new password',
    description: 'A18n label for the hidden new password button.',
    id: 'features.Profile.AccountSettings.hideNewPassword',
  },
  passwordValidation: {
    defaultMessage: 'Repeat new password',
    description: 'Label for password confirmation text input.',
    id: 'features.Profile.AccountSettings.passwordValidation',
  },
  revealPasswordValidation: {
    defaultMessage: 'Reveal password confirmation',
    description: 'A18n label for the reveal password confirmation button.',
    id: 'features.Profile.AccountSettings.revealPasswordValidation',
  },
  hidePasswordValidation: {
    defaultMessage: 'Hide password confirmation',
    description: 'A18n label for the hidden password confirmation button.',
    id: 'features.Profile.AccountSettings.hidePasswordValidation',
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
  const [error, setError] = useState<ResetPasswordError>();
  const { mutate: updatePassword } = useMutation<
    void,
    FetchResponseError<ResetPasswordError>,
    FormValue
  >({
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
      if (isError(backError.error)) {
        setError(backError.error);
      }
    },
  });
  const [values, setValues] = useState<FormValue>({
    currentPassword: '',
    newPassword: '',
    passwordValidation: '',
  });

  return (
    <Box>
      <Heading level={1}>{intl.formatMessage(messages.header)}</Heading>
      <Box
        width={{
          max: 'large',
          width: 'full',
        }}
        margin={{ horizontal: 'auto' }}
      >
        <WhiteCard>
          <Heading level={4}>{intl.formatMessage(messages.title)}</Heading>
          <Box margin={{ left: '30%' }}>
            <Box gap="small">
              <PrivateTextInputField
                autoComplete="current-password"
                label={intl.formatMessage(messages.currentPassword)}
                revealButtonLabel={intl.formatMessage(
                  messages.revealCurrentPassword,
                )}
                hideButtonLabel={intl.formatMessage(
                  messages.hideCurrentPassword,
                )}
                state={error?.old_password ? 'error' : undefined}
                text={error?.old_password?.join(' ')}
                value={values.currentPassword}
                onChange={(e) => {
                  setValues((_value) => ({
                    ..._value,
                    currentPassword: e.target.value,
                  }));
                  setError(undefined);
                }}
              />

              <PrivateTextInputField
                autoComplete="new-password"
                label={intl.formatMessage(messages.newPassword)}
                revealButtonLabel={intl.formatMessage(
                  messages.revealNewPassword,
                )}
                hideButtonLabel={intl.formatMessage(messages.hideNewPassword)}
                state={error?.new_password1 ? 'error' : undefined}
                text={error?.new_password1?.join(' ')}
                value={values.newPassword}
                onChange={(e) => {
                  setValues((_value) => ({
                    ..._value,
                    newPassword: e.target.value,
                  }));
                  setError(undefined);
                }}
              />

              <PrivateTextInputField
                autoComplete="new-password"
                label={intl.formatMessage(messages.passwordValidation)}
                revealButtonLabel={intl.formatMessage(
                  messages.revealPasswordValidation,
                )}
                hideButtonLabel={intl.formatMessage(
                  messages.hidePasswordValidation,
                )}
                state={error?.new_password2 ? 'error' : undefined}
                text={error?.new_password2?.join(' ')}
                value={values.passwordValidation}
                onChange={(e) => {
                  setValues((_value) => ({
                    ..._value,
                    passwordValidation: e.target.value,
                  }));
                  setError(undefined);
                }}
              />
            </Box>
            <Box>
              <Button
                className="mt-s"
                type="submit"
                title={intl.formatMessage(messages.submit)}
                aria-label={intl.formatMessage(messages.submit)}
                style={{ alignSelf: 'end' }}
                onClick={() => updatePassword(values)}
              >
                {intl.formatMessage(messages.submit)}
              </Button>
            </Box>
          </Box>
        </WhiteCard>
      </Box>
    </Box>
  );
};
