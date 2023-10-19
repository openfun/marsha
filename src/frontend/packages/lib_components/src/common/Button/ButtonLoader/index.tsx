import { Button } from '@openfun/cunningham-react';
import { Stack } from 'grommet';

import {
  BoxLoader,
  BoxLoaderProps,
} from '@lib-components/common/Loader/BoxLoader';

type ButtonProps = React.ComponentPropsWithRef<typeof Button>;

export interface ButtonLoaderProps extends ButtonProps {
  isDisabled?: boolean;
  isSubmitting?: boolean;
  onClickSubmit?: () => void;
  spinnerProps?: BoxLoaderProps;
}

/**
 * @param ButtonLoaderProps -
 *  - isDisabled will deactivate the submit button
 *  - isSubmitting will deactivate the submit button and add a loader above it
 *  - init onClickSubmit switch the button from type submit to type button
 * @returns ButtonLoader component
 */
export const ButtonLoader = ({
  isDisabled,
  isSubmitting,
  onClickSubmit,
  spinnerProps,
  children,
  ...buttonProps
}: ButtonLoaderProps) => {
  return (
    <Stack style={{ flex: '3' }} guidingChild="first" interactiveChild="first">
      <Button
        type={onClickSubmit ? 'button' : 'submit'}
        disabled={isDisabled || isSubmitting}
        onClick={onClickSubmit}
        fullWidth
        {...buttonProps}
      >
        {children}
      </Button>
      {isSubmitting && <BoxLoader {...spinnerProps} />}
    </Stack>
  );
};
