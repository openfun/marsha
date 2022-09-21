import { ThemeType } from 'grommet/themes/base';
import { deepMerge } from 'grommet/utils';
import { theme } from 'lib-common';

export const themeExtend: ThemeType = deepMerge(theme, {
  global: {
    colors: {
      text: {
        light: 'blue-active',
      },
      'bg-menu-hover': '#CDDEF5',
    },
  },
});
