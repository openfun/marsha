import { Input } from '@openfun/cunningham-react';
import { Button } from 'grommet';
import { ComponentPropsWithRef, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { ReactComponent as HideContent } from 'assets/svg/hide-content.svg';
import { ReactComponent as ShowContent } from 'assets/svg/show-content.svg';

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
          a11yTitle={
            isHidden
              ? revealButtonLabel || intl.formatMessage(messages.revealPassword)
              : hideButtonLabel || intl.formatMessage(messages.hidePassword)
          }
          plain
          style={{ margin: '0 1rem' }}
          icon={isHidden ? <ShowContent /> : <HideContent />}
          onClick={() => setIsHidden(!isHidden)}
        />
      }
      type={isHidden ? 'password' : 'text'}
      {...inputProps}
    />
  );
};
