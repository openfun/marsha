import { Box, Button, ButtonExtendedProps, Stack } from 'grommet';

import { Spinner, SpinnerLookProps } from '@lib-components/common/Loader';

export enum ButtonLoaderStyle {
  DEFAULT = 'DEFAULT',
  DESTRUCTIVE = 'red-active',
}

interface ButtonLoaderProps {
  isDisabled?: boolean;
  isSubmitting?: boolean;
  onClickSubmit?: () => void;
  spinnerProps?: SpinnerLookProps;
  style?: ButtonLoaderStyle;
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
  style,
  spinnerProps,
  ...buttonProps
}: ButtonLoaderProps & ButtonExtendedProps) => {
  return (
    <Stack style={{ flex: '3' }} guidingChild="first" interactiveChild="first">
      <Button
        type={onClickSubmit ? 'button' : 'submit'}
        disabled={isDisabled || isSubmitting}
        primary
        onClick={onClickSubmit}
        fill="horizontal"
        color={
          style === ButtonLoaderStyle.DESTRUCTIVE
            ? ButtonLoaderStyle.DESTRUCTIVE
            : undefined
        }
        {...buttonProps}
      />
      {isSubmitting && (
        <Box fill>
          <Box margin="auto">
            <Spinner {...spinnerProps} />
          </Box>
        </Box>
      )}
    </Stack>
  );
};
