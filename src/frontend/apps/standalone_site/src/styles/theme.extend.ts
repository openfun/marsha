import { deepMerge } from 'grommet/utils';
import { theme } from 'lib-common';
import { css } from 'styled-components';

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

export const disableFormTheme = {
  global: { control: { disabled: { opacity: 1 } } },
  textInput: {
    extend: css`
      cursor: text;
    `,
  },
  select: {
    control: {
      extend: css`
        font-size: 1rem;
        padding: 0;
        opacity: 1;
        & input {
          cursor: text;
        }
      `,
    },
  },
  formField: {
    extend: css`
      & {
        background-color: white;
        transition: all 0.2s linear;
      }
      & input,
      & textarea {
        margin-top: 1rem;
      }
      & input::placeholder {
        color: transparent;
      }
      & input:focus {
        box-shadow: none;
      }
      & input {
        font-size: 1rem;
        padding: 0.5rem 1rem;
      }
      & label {
        height: 0.1px;
        margin: 0 1rem 0;
        transform: translateY(0.3rem);
        z-index: 1;
      }
      & label span[aria-hidden='true'] {
        font-size: 0.688rem;
      }
      & svg {
        color: transparent;
        fill: transparent;
        stroke: transparent;
      }
    `,
  },
};
