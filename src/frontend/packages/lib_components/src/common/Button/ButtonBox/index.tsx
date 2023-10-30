import { Box, BoxProps } from '@lib-components/common/Box';

export const ButtonBox = (props: BoxProps<'div'>) => {
  return (
    <Box
      role="button"
      {...props}
      style={{ cursor: 'pointer', boxShadow: 'none', ...props.style }}
    />
  );
};
