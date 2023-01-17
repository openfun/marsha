import { Button, TextInput } from 'grommet';
import { FormField } from 'lib-components';
import { useState } from 'react';

import { ReactComponent as HideContent } from 'assets/svg/hide-content.svg';
import { ReactComponent as ShowContent } from 'assets/svg/show-content.svg';

interface PrivateTextInputFieldProps {
  id: string;
  name: string;
  label: string;
  showButtonLabel?: string;
  hiddeButtonLabel?: string;
}

export const PrivateTextInputField = ({
  id,
  name,
  label,
  showButtonLabel,
  hiddeButtonLabel,
}: PrivateTextInputFieldProps) => {
  const [isHidden, setIsHidden] = useState(true);

  return (
    <FormField
      htmlFor={id}
      name={name}
      label={label}
      contentProps={{ direction: 'row' }}
    >
      <TextInput id={id} name={name} type={isHidden ? 'password' : 'text'} />
      <Button
        a11yTitle={isHidden ? showButtonLabel : hiddeButtonLabel}
        plain
        margin={{ horizontal: 'xsmall' }}
        icon={isHidden ? <ShowContent /> : <HideContent />}
        onClick={() => {
          setIsHidden((currentValue) => !currentValue);
        }}
      />
    </FormField>
  );
};
