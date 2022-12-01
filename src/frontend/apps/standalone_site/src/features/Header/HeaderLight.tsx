import { Box } from 'grommet';
import { Nullable } from 'lib-common';
import { forwardRef } from 'react';

import { ReactComponent as LogoIcon } from 'assets/svg/logo_marsha.svg';

const HeaderLight = forwardRef<Nullable<HTMLDivElement>>((_props, ref) => {
  return (
    <Box
      ref={ref}
      role="menubar"
      pad="small"
      background={{ color: 'bg-marsha' }}
    >
      <LogoIcon width={117} height={80} />
    </Box>
  );
});

HeaderLight.displayName = 'HeaderLight';
export default HeaderLight;
