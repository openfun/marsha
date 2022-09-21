import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { Box, Text } from 'grommet';
import React from 'react';

function Header() {
  return (
    <Box role="menubar">
      <Box direction="row" align="center" gap="small" justify="end">
        <Text>John Doe</Text>
        <AvatarIcon width={42} height={42} />
      </Box>
    </Box>
  );
}

export default Header;
