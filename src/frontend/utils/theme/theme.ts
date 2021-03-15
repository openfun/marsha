import { rgba } from 'polished';

const colorsGeneric = {
  'accent-1': 'brand',
  'accent-2': '#f72b2f',
  'accent-3': 'dark1',
  'accent-4': '#ffca58',
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
      weight: '400',
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
    margin: 'small',
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
};
