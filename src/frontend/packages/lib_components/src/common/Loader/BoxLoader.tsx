import { Loader } from '@openfun/cunningham-react';
import { Box, BoxProps } from 'grommet';
import { ComponentPropsWithoutRef } from 'react';

type LoaderProps = ComponentPropsWithoutRef<typeof Loader>;
export interface BoxLoaderProps extends LoaderProps {
  boxProps?: BoxProps;
  whiteBackground?: boolean;
}
export const BoxLoader = ({
  boxProps,
  whiteBackground,
  ...loaderProps
}: BoxLoaderProps) => {
  let boxPropsAdd: BoxProps = { ...boxProps };
  if (whiteBackground) {
    boxPropsAdd = {
      ...boxProps,
      background: 'white',
      round: 'full',
      pad: '2px',
    };
  }

  return (
    <Box
      height="full"
      justify="center"
      align="center"
      aria-label="loader"
      aria-live="polite"
      {...boxPropsAdd}
    >
      <Loader {...loaderProps} />
    </Box>
  );
};
