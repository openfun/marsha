import logo from 'assets/img/marshaBlueLogo.png';
import { ReactComponent as AvatarIcon } from 'assets/svg/iko_avatarsvg.svg';
import { ReactComponent as BurgerIcon } from 'assets/svg/iko_burgersvg.svg';
import { ReactComponent as CheckListIcon } from 'assets/svg/iko_checklistsvg.svg';
import { ReactComponent as HomeIcon } from 'assets/svg/iko_homesvg.svg';
import { ReactComponent as StarIcon } from 'assets/svg/iko_starsvg.svg';
import { ReactComponent as VueListIcon } from 'assets/svg/iko_vuelistesvg.svg';
import { Box, Image, Text } from 'grommet';
import { normalizeColor } from 'grommet/utils';
import { theme } from 'lib-common';
import React from 'react';
import styled from 'styled-components';
import MenuItem from './MenuItem';

const colorMenu = normalizeColor('blue-active', theme);

const MenuBox = styled(Box)`
  box-shadow: 0px 0px 4px 0px rgba(104, 111, 122, 0.3);
  z-index: 1;
`;

const routes = [
  {
    icon: <HomeIcon width={30} height={30} />,
    label: 'Dashboard',
    isActive: true,
  },
  {
    icon: <StarIcon width={30} height={30} />,
    label: 'Favorites',
    isActive: false,
  },
  {
    icon: <AvatarIcon width={30} height={30} />,
    label: 'My Profile',
    isActive: false,
  },
];

const contents = [
  {
    icon: <VueListIcon width={30} height={30} />,
    label: 'My playlists',
    isActive: false,
  },
  {
    icon: <VueListIcon width={30} height={30} />,
    label: 'My Organizations',
    isActive: false,
  },
  {
    icon: <VueListIcon width={30} height={30} />,
    label: 'My Contents',
    isActive: false,
    subContent: [
      {
        icon: <CheckListIcon width={30} height={30} />,
        label: 'Vidéos',
        isActive: false,
      },
      {
        icon: <CheckListIcon width={30} height={30} />,
        label: 'Lives',
        isActive: false,
      },
      {
        icon: <CheckListIcon width={30} height={30} />,
        label: 'Classes virtuelles',
        isActive: false,
      },
      {
        icon: <CheckListIcon width={30} height={30} />,
        label: 'Leçons',
        isActive: false,
      },
    ],
  },
];

function Menu() {
  return (
    <MenuBox
      role="menu"
      width="18.75rem"
      pad={{ vertical: '0.625rem', left: '0.825rem', right: '3.75rem' }}
    >
      <Box direction="row" justify="between" margin={{ bottom: 'small' }}>
        <Box margin={{ top: 'small', left: '1rem' }}>
          <BurgerIcon width={30} height={30} aria-controls="menu" />
        </Box>
        <Image
          margin={{ right: 'medium' }}
          src={logo}
          width={117}
          alt="Marsha Blue Logo"
        />
      </Box>
      <Box role="group">
        {routes.map((route) => (
          <MenuItem
            key={`menuItemRoute-${route.label}`}
            icon={route.icon}
            routeLabel={route.label}
            isActive={route.isActive}
          />
        ))}
      </Box>
      <Box
        height="1px"
        background={{ color: `${colorMenu}26` }}
        margin={{ vertical: 'medium', horizontal: 'xxsmall' }}
      />
      <Box role="group">
        <Text size="small" weight="bold" margin={{ left: '1rem' }}>
          TYPES DE CONTENUS
        </Text>
        {contents.map((content) => (
          <MenuItem
            key={`menuItemContent-${content.label}`}
            icon={content.icon}
            routeLabel={content.label}
            isActive={content.isActive}
          >
            {content.subContent && (
              <Box margin={{ left: '2.6rem' }}>
                {content.subContent.map((subContent) => (
                  <MenuItem
                    key={`menuItemSubContent-${subContent.label}`}
                    icon={subContent.icon}
                    routeLabel={subContent.label}
                    isActive={subContent.isActive}
                  />
                ))}
              </Box>
            )}
          </MenuItem>
        ))}
      </Box>
    </MenuBox>
  );
}

export default Menu;
