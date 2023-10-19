import { Box, BoxExtendedProps } from 'grommet';

export const ButtonBox = (props: BoxExtendedProps) => {
  return (
    <Box
      role="button"
      {...props}
      style={{ cursor: 'pointer', boxShadow: 'none', ...props.style }}
    />
  );
};
