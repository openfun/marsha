import { Box, Button, Stack } from 'grommet';

import { Spinner } from '@lib-components/common/Loader';

export enum ButtonLoaderStyle {
  DEFAULT = 'DEFAULT',
  DESTRUCTIVE = 'red-active',
}

interface ButtonLoaderProps {
  label: string;
  isDisabled?: boolean;
  isSubmitting?: boolean;
  onClickSubmit?: () => void;
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
  label,
  isDisabled,
  isSubmitting,
  onClickSubmit,
  style,
}: ButtonLoaderProps) => {
  return (
    <Stack style={{ flex: '3' }} guidingChild="first" interactiveChild="first">
      <Button
        type={onClickSubmit ? 'button' : 'submit'}
        disabled={isDisabled || isSubmitting}
        primary
        label={label}
        onClick={onClickSubmit}
        fill="horizontal"
        color={
          style === ButtonLoaderStyle.DESTRUCTIVE
            ? ButtonLoaderStyle.DESTRUCTIVE
            : undefined
        }
      />
      {isSubmitting && (
        <Box fill>
          <Box margin="auto">
            <Spinner />
          </Box>
        </Box>
      )}
    </Stack>
  );
};
