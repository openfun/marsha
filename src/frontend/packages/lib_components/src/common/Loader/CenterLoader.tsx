import { Loader } from '@openfun/cunningham-react';
import { Box, BoxProps } from 'grommet';
import { ComponentPropsWithoutRef } from 'react';

type LoaderProps = ComponentPropsWithoutRef<typeof Loader>;
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
