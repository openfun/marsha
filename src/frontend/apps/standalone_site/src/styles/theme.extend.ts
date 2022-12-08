import { deepMerge } from 'grommet/utils';
import { theme } from 'lib-common';

export const themeExtend = {
  box: {
    extend: '',
  },
  global: {
    colors: {
      text: {
        light: 'blue-active',
      },
    },
    elevation: {
      light: {
        even: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
      },
      dark: {
        even: '0px 0px 6px 0px rgba(2, 117, 180, 0.3)',
      },
    },
    breakpoints: {
      xxsmall: { value: 380 },
      xsmall: { value: 540 },
      xsmedium: { value: 1024 },
      smedium: { value: 1280 },
      large: { value: 9999 },
    },
  },
};

export const themeBase = theme;

export const getFullThemeExtend = () => deepMerge(themeBase, themeExtend);
