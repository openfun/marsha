import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import { forwardRef } from 'react';

import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';

interface HeaderLightProps {
  bgcolor?: string;
  color?: string;
}

const HeaderLight = forwardRef<Nullable<HTMLDivElement>, HeaderLightProps>(
  ({ bgcolor, color }, ref) => {
    return (
      <Box
        ref={ref}
        role="menubar"
        pad="small"
        background={{ color: bgcolor || 'bg-marsha' }}
      >
        <LogoIcon width={117} height={80} color={color} />
      </Box>
    );
  },
);

HeaderLight.displayName = 'HeaderLight';
export default HeaderLight;
