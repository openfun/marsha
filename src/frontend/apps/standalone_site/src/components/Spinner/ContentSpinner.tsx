import { Box, BoxProps, Spinner, SpinnerProps } from 'grommet';

export const ContentSpinner = ({
  boxProps,
  spinnerProps,
}: {
  boxProps?: BoxProps;
  spinnerProps?: SpinnerProps;
}) => (
  <Box
    height="full"
    justify="center"
    align="center"
    aria-label="spinner"
    role="alert"
    {...boxProps}
  >
    <Spinner size="medium" {...spinnerProps} />
  </Box>
);
