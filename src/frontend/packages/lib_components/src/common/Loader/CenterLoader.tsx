import { Loader } from '@openfun/cunningham-react';
import { Box, BoxProps } from 'grommet';

type LoaderProps = React.ComponentProps<typeof Loader>;
interface CenterLoaderProps {
  boxProps?: BoxProps;
  loaderProps?: LoaderProps;
}
export const CenterLoader = ({ boxProps, loaderProps }: CenterLoaderProps) => (
  <Box
    height="full"
    justify="center"
    align="center"
    aria-label="loader"
    {...boxProps}
  >
    <Loader {...loaderProps} />
  </Box>
);
