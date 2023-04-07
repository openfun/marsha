import { TextProps, ThemeType } from 'grommet';
import { ColorType } from 'grommet/utils';
import { rgba } from 'polished';
import { css } from 'styled-components';

const colorsGeneric = {
  'accent-1': 'brand',
  'accent-2': '#f72b2f',
  'accent-3': 'dark1',
  'accent-4': '#ffca58',
  'bg-bloc': '#d4e5f5',
  'bg-darkblue': '#002438',
  'bg-info': '#f0f6fe',
  'bg-grey': '#717171',
  'bg-lightgrey': '#afafaf',
  'bg-lightgrey2': '#f8fafe',
  'bg-marsha': '#edf5fa',
  'bg-menu-hover': '#CDDEF5',
  'bg-select': '#e5eefa',
  'blue-active': '#055fd2',
  'blue-content': '#002c84',
  'blue-focus': '#031963',
  'blue-hover': '#2d76d3',
  'blue-hover-light': '#E5F1F8',
  'blue-off': '#81ade6',
  'blue-chat': '#0a67de',
  'blue-message': '#ecf3fc',
  'blue-button': '#035ccd',
  'border-grey': '#979797',
  'content-background': '#E5EEFA',
  'dark-1': '#08223c',
  'dark-2': '#183653',
  'dark-3': '#2e4d6b',
  'dark-4': '#456787',
  'dark-5': '#456787',
  'dark-6': '#456787',
  'light-1': '#f7f7f7',
  'light-2': '#eeeeef',
  'light-3': '#e5e6e6',
  'light-4': '#dcddde',
  'light-5': '#d3d4d5',
  'light-6': '#cbcccd',
  'neutral-1': '#00873d',
  'neutral-2': '#3d138d',
  'neutral-3': '#00739d',
  'neutral-4': '#a2423d',
  'red-active': '#da0000',
  'red-focus': '#ae0000',
  'red-hover': '#e22d2d',
  'red-off': '#ec8080',
  'shadow-1': '#dcebf4',
  'status-critical': 'accent-2',
  'status-disabled': '#cccccc',
  'status-error': 'accent-2',
  'status-error-off': '#f9e8e8',
  'status-ok': '#00c781',
  'status-unknown': '#cccccc',
  'status-warning': '#ffaa15',
  'dark-background': '#001a29',
};

const colorsMain = {
  active: rgba(221, 221, 221, 0.5),
  black: '#000000',
  border: {
    dark: rgba(255, 255, 255, 0.33),
    light: rgba(0, 0, 0, 0.33),
  },
  brand: '#007bff',
  control: {
    dark: 'accent-1',
    light: 'brand',
  },
  focus: 'accent-1',
  icon: {
    dark: '#f8f8f8',
    light: '#666666',
  },
  placeholder: '#aaaaaa',
  selected: 'brand',
  text: {
    dark: '#f8f8f8',
    light: '#444444',
  },
  white: '#ffffff',
};

export const colors = {
  ...colorsMain,
  ...colorsGeneric,
};

interface Font {
  color?: ColorType;
  fontFamily?: string;
  fontSize?: TextProps['size'];
  fontWeight?: TextProps['weight'];
  letterSpacing?: string;
  lineHeight?: string;
}

export const chatFonts: { primary: Font; secondary: Font; tertiary: Font } = {
  primary: {
    color: colorsGeneric['blue-focus'],
    fontFamily: 'Roboto-Medium',
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.07px',
    lineHeight: '16px',
  },
  secondary: {
    color: colorsGeneric['blue-chat'],
    fontSize: '0.75rem',
    fontFamily: 'Roboto-Regular',
    fontWeight: 'normal',
    letterSpacing: '0.07px',
    lineHeight: '18px',
  },
  tertiary: {
    color: '#357cd7',
    fontSize: '0.563rem',
    fontFamily: 'Roboto-Regular',
    fontWeight: 'normal',
    letterSpacing: '-0.2px',
  },
};

/**
 * Breakpoints:
 * - xxsmall: 380px
 * - xsmall: 540px
 * - small: 768px
 * - xsmedium: 1024px
 * - smedium: 1280px
 * - medium: 1536px
 * - large: 9999px
 */
export enum Breakpoints {
  xxsmall = 'xxsmall',
  xsmall = 'xsmall',
  small = 'small',
  xsmedium = 'xsmedium',
  smedium = 'smedium',
  medium = 'medium',
  large = 'large',
}

export const breakpointsExtended = {
  [Breakpoints.xxsmall]: { value: 380 },
  [Breakpoints.xsmall]: { value: 540 },
  [Breakpoints.xsmedium]: { value: 1024 },
  [Breakpoints.smedium]: { value: 1280 },
  [Breakpoints.large]: { value: 9999 },
};

export const theme: ThemeType = {
  box: {
    extend: 'min-height: initial; min-width: initial;',
  },
  button: {
    default: {
      background: { color: 'white' },
      border: { color: 'brand', width: '1px', radius: '4px' },
      color: 'blue-active',
      padding: { vertical: 'small', horizontal: 'medium' },
    },
    primary: {
      background: { color: 'blue-button' },
      border: {
        radius: '4px',
      },
      color: 'white',
      padding: { vertical: 'small', horizontal: 'medium' },
    },
    secondary: {
      background: { color: 'transparent' },
      border: { color: 'brand', width: '1px', radius: '4px' },
      color: 'blue-active',
      padding: { vertical: 'small', horizontal: 'medium' },
    },
    border: {
      radius: '4px',
    },
    size: {
      large: {
        border: {
          radius: '6px',
        },
        pad: {
          horizontal: '3rem',
          vertical: '1rem',
        },
      },
    },
  },
  global: {
    size: {
      xsmedium: '240px',
      xlmedium: '480px',
    },
    colors,
    input: {
      weight: 'normal',
      padding: {
        vertical: '8px',
        horizontal: '16px',
      },
      extend: `color: ${colorsGeneric['blue-chat']};`,
    },
    font: {
      family: 'Roboto-Regular',
    },
    breakpoints: breakpointsExtended,
  },
  heading: {
    level: {
      5: {
        small: {
          height: '1.5rem',
          maxWidth: 'initial',
          size: '1rem',
        },
        medium: {
          height: '1.5rem',
          maxWidth: 'initial',
          size: '1rem',
        },
        large: {
          height: '1.5rem',
          maxWidth: 'initial',
          size: '1rem',
        },
        xlarge: {
          height: '1.5rem',
          maxWidth: 'initial',
          size: '1rem',
        },
      },
      6: {
        small: {
          height: '1.5rem',
          maxWidth: 'initial',
          size: '1rem',
        },
        medium: {
          height: '1.5rem',
          maxWidth: 'initial',
          size: '1rem',
        },
        large: {
          height: '1.5rem',
          maxWidth: 'initial',
          size: '1rem',
        },
        xlarge: {
          height: '1.5rem',
          maxWidth: 'initial',
          size: '1rem',
        },
      },
    },
  },
  card: {
    container: {
      round: false,
    },
  },
  formField: {
    focus: {
      border: {
        color: 'blue-focus',
      },
    },
    label: {
      requiredIndicator: true,
      size: '0.688rem',
      margin: '0.3rem 1rem 0',
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
    error: {
      container: {
        a11yTitle: 'error-form-field',
      },
    },
    help: {
      margin: '0.3rem 1rem 0',
      color: 'bg-grey',
    },
    disabled: {
      border: {
        color: 'bg-grey',
      },
    },
    extend: css`
      & {
        background-color: white;
        transition: all 0.2s linear;
      }
      & input {
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
      }
      & label {
        height: 0.1px;
        margin: 0 1rem 0;
        transform: translateY(0.3rem);
      }
      & label span[aria-hidden='true'] {
        font-size: 0.688rem;
      }
      & input:-webkit-autofill,
      & input:-webkit-autofill:focus {
        transition: background-color 600000s 0s, color 600000s 0s;
      }
      & svg {
        color: ${colorsGeneric['blue-active']};
        fill: ${colorsGeneric['blue-active']};
        stroke: ${colorsGeneric['blue-active']};
      }
      &:hover {
        box-shadow: 0 0 0 2px ${colorsGeneric['blue-active']};
      }
      &:focus-within {
        border-color: ${colorsGeneric['blue-focus']};
        box-shadow: 0 0 0 2px ${colorsGeneric['blue-focus']};
      }
      &:focus-within input,
      &:focus-within label {
        color: ${colorsGeneric['blue-focus']};
      }
      &:focus-within svg {
        color: ${colorsGeneric['blue-focus']};
        fill: ${colorsGeneric['blue-focus']};
        stroke: ${colorsGeneric['blue-focus']};
      }
      &:has(div[aria-label='error-form-field']),
      &:focus-within:has(div[aria-label='error-form-field']) {
        border-color: ${colorsGeneric['red-active']};
        box-shadow: 0 0 0 2px ${colorsGeneric['red-active']};
      }
      & div[aria-label='error-form-field'] span {
        color: white;
      }
      & div[aria-label='error-form-field'] {
        background-color: ${colorsGeneric['red-active']};
        margin: 2px;
        border-radius: 4px;
      }
      & div[aria-label='error-form-field'] span {
        color: white;
        font-size: 1rem;
      }
    `,
  },
  textArea: {
    extend: css`
      & {
        margin-top: 1rem;
      }
      &:focus-within {
        color: ${colorsGeneric['blue-focus']};
      }
    `,
  },
  select: {
    control: {
      extend: `
        font-size: 1rem; 
        border-color: ${colorsGeneric['blue-active']}; 
        padding: 0;
      `,
    },
    container: {
      extend: css`
        & {
          border: 1px solid ${colorsGeneric['blue-active']};
        }
        & button {
          transition: all 0.2s linear;
          width: 98%;
          border-radius: 4px;
          margin: 0.125rem 0 0.125rem 1%;
        }
        & button > div {
          padding: 1rem;
        }
        & button:hover {
          background-color: ${colorsGeneric['blue-hover-light']};
          color: inherit;
        }
        & button span[aria-live='polite'] {
          font-size: 14px;
        }
        & button[aria-selected='true'] {
          background-color: ${colorsMain['brand']};
        }
        & button[aria-selected='true'] span {
          color: white;
        }
      `,
    },
    options: {
      container: {
        pad: 'small',
      },
      text: {
        size: '0.875rem',
        color: 'blue-active',
      },
    },
  },
  tab: {
    active: {
      color: 'blue-focus',
    },
    color: 'blue-active',
    border: {
      active: { color: 'blue-focus' },
      color: 'blue-active',
      hover: {
        color: 'blue-focus',
      },
      side: 'bottom',
    },
    hover: {
      color: 'blue-focus',
    },
    pad: 'small',
    margin: {
      vertical: 'small',
      horizontal: 'none',
    },
  },
  tip: {
    content: {
      background: 'white',
      elevation: 'none',
      margin: 'xsmall',
      pad: {
        vertical: 'small',
        horizontal: 'small',
      },
      round: false,
    },
  },
  paragraph: {
    small: {
      height: '1rem',
      maxWidth: 'initial',
      size: '1rem',
    },
    medium: {
      height: '1.125rem',
      maxWidth: 'initial',
      size: '1rem',
    },
    large: {
      height: '1.25rem',
      maxWidth: 'initial',
      size: '1.125rem',
    },
    xlarge: {
      height: '1.5rem',
      maxWidth: 'initial',
      size: '1.25rem',
    },
    xxlarge: {
      height: '1.75rem',
      maxWidth: 'initial',
      size: '1.5rem',
    },
  },
  maskedInput: {
    extend: 'padding: 0.5rem 1rem;',
  },
  dateInput: {
    icon: {
      size: '18px',
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
  calendar: {
    heading: {
      level: '5',
    },
    extend: css`
      & div[role='grid'] {
        box-shadow: none;
      }
      & button {
        border: none;
      }
      & button:has(svg) {
        padding: 0.75rem;
      }
    `,
  },
};
