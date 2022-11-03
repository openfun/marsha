import { ThemeType } from 'grommet/themes/base';
import { deepMerge } from 'grommet/utils';
import { theme } from 'lib-common';

export const themeExtend: ThemeType = deepMerge(theme, {
  box: {
    extend: '',
  },
  global: {
    size: {
      xsmedium: '240px',
      xlmedium: '480px',
    },
    colors: {
      'content-background': '#E5EEFA',
      text: {
        light: 'blue-active',
      },
      'bg-menu-hover': '#CDDEF5',
    },
    elevation: {
      light: {
        even: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
      },
      dark: {
        even: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
      },
    },
  },
  pagination: {
    button: {
      color: 'blue-active',
      active: {
        background: {
          color: '#dbebff',
        },
      },
    },
  },
});
