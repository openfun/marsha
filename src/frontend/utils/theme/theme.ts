import { TextProps } from 'grommet';
import { ColorType } from 'grommet/utils';
import { rgba } from 'polished';

export const breakpointSize = {
  mobileS: '320px',
  mobileM: '375px',
  mobileL: '425px',
  tablet: '768px',
  laptop: '1024px',
  laptopL: '1440px',
  desktop: '2560px',
};

const colorsGeneric = {
  'accent-1': 'brand',
  'accent-2': '#f72b2f',
  'accent-3': 'dark1',
  'accent-4': '#ffca58',
  'bg-bloc': '#d4e5f5',
  'bg-darkblue': '#002438',
  'bg-grey': '#717171',
  'bg-lightgrey': '#afafaf',
  'bg-marsha': '#edf5fa',
  'bg-select': '#e5eefa',
  'blue-active': '#035ccd',
  'blue-focus': '#0249a4',
  'blue-hover': '#357cd7',
  'blue-off': '#81ade6',
  'blue-chat': '#0a67de',
  'border-grey': '#979797',
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
  'neutral-1': '#00873D',
  'neutral-2': '#3D138D',
  'neutral-3': '#00739D',
  'neutral-4': '#A2423D',
  'red-active': '#da0000',
  'red-focus': '#ae0000',
  'red-hover': '#e13333',
  'red-off': '#ec8080',
  'shadow-1': '#dcebf4',
  'status-critical': 'accent-2',
  'status-disabled': '#cccccc',
  'status-error': 'accent-2',
  'status-ok': '#00c781',
  'status-unknown': '#cccccc',
  'status-warning': '#ffaa15',
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

interface Font {
  color?: ColorType;
  fontFamily?: string;
  fontSize?: TextProps['size'];
  fontWeight?: TextProps['weight'];
  letterSpacing?: string;
  lineHeight?: string;
}

const chatFonts: { primary: Font; secondary: Font; tertiary: Font } = {
  primary: {
    color: '#031963',
    fontFamily: 'Roboto-Medium',
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '0.07px',
    lineHeight: '16px',
  },
  secondary: {
    color: colorsGeneric['blue-chat'],
    fontSize: '12px',
    fontFamily: 'Roboto-Regular',
    fontWeight: 'normal',
    letterSpacing: '0.07px',
    lineHeight: '18px',
  },
  tertiary: {
    color: '#357cd7',
    fontSize: '9px',
    fontFamily: 'Roboto-Regular',
    fontWeight: 'normal',
    letterSpacing: '-0.2px',
  },
};

export const theme = {
  box: {
    extend: 'min-height: initial; min-width: initial;',
  },
  button: {
    border: {
      radius: '4px',
    },
    extend: 'padding: 0.5rem 1rem;',
  },
  global: {
    colors: {
      ...colorsGeneric,
      ...colorsMain,
    },
    input: {
      weight: 'normal',
      extend: `color: ${colorsGeneric['blue-chat']};`,
    },
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
  image: {
    extend: 'max-width: 100%;',
  },
  card: {
    container: {
      round: false,
    },
  },
  formField: {
    label: {
      size: '1.5rem',
    },
  },
  tab: {
    color: 'text',
    border: {
      side: 'bottom',
      color: 'background-back',
      hover: {
        color: 'control',
      },
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
  chat: {
    chatFonts,
  },
};
