import { deepMerge } from 'grommet/utils';
import { theme } from 'lib-common';
import { css } from 'styled-components';

export const themeExtend = {
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
    breakpoints: {
      xxsmall: { value: 380 },
      xsmall: { value: 540 },
      xsmedium: { value: 1024 },
      smedium: { value: 1280 },
      large: { value: 9999 },
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
  select: {
    options: {
      container: {
        pad: 'small',
      },
      text: {
        size: 'small',
      },
    },
  },
  formField: {
    label: {
      size: '0.8rem',
      margin: '0.5rem 1rem 0',
      color: 'bg-grey',
    },
    border: {
      position: 'outer',
      side: 'all',
      color: 'blue-active',
      style: 'solid',
    },
    round: {
      size: 'xsmall',
    },
    margin: { bottom: 'large' },
    extend: css`
      & {
        border: 1px solid;
        border-bottom: 2px solid;
        border-right: 2px solid;
      }
      & input::placeholder {
        font-size: 0.8rem;
        padding-left: 0.2rem;
      }
      & label {
        margin-top: -9px;
        background: white;
        width: fit-content;
        padding: 0 9px 0 5px;
      }
      &.mandatory label {
        margin-top: -13px;
      }
    `,
    textInput: {
      extend: 'padding: 0 1rem 0.8rem',
    },
    maskedInput: {
      extend: 'padding: 0 1rem 0.8rem',
    },
    dateInput: {
      icon: {
        size: '18px',
      },
    },
  },
};

export const themeBase = theme;

export const getFullThemeExtend = () => deepMerge(themeBase, themeExtend);
