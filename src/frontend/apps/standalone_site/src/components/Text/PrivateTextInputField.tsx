import { Button, Input } from '@openfun/cunningham-react';
import { ComponentPropsWithRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import HideContent from 'assets/svg/hide-content.svg?react';
import ShowContent from 'assets/svg/show-content.svg?react';

const messages = defineMessages({
  revealPassword: {
    defaultMessage: 'Show the password.',
    description: 'A18n label for the password button.',
    id: 'components.Text.PrivateTextInputfield.revealPassword',
  },
  hidePassword: {
    defaultMessage: 'Hide the password.',
    description: 'A18n label for the hidden password button.',
    id: 'components.Text.PrivateTextInputfield.hidePassword',
  },
});

type InputProps = ComponentPropsWithRef<typeof Input>;

interface PrivateTextInputFieldProps extends InputProps {
  revealButtonLabel?: string;
  hideButtonLabel?: string;
}

export const PrivateTextInputField = ({
  label,
  revealButtonLabel,
  hideButtonLabel,
  ...inputProps
}: PrivateTextInputFieldProps) => {
  const intl = useIntl();
  const [isHidden, setIsHidden] = useState(true);

  return (
    <Input
      aria-label={label}
      label={label}
      fullWidth
      required
      rightIcon={
        <Button
          type="button"
          className="c__button-no-bg"
          color="tertiary"
          aria-label={
            isHidden
              ? revealButtonLabel || intl.formatMessage(messages.revealPassword)
              : hideButtonLabel || intl.formatMessage(messages.hidePassword)
          }
          icon={isHidden ? <ShowContent /> : <HideContent />}
          onClick={() => setIsHidden(!isHidden)}
        />
      }
      type={isHidden ? 'password' : 'text'}
      {...inputProps}
    />
  );
};
